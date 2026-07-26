#!/usr/bin/env node

import {execFile as execFileCallback} from 'node:child_process';
import {promises as fs} from 'node:fs';
import path from 'node:path';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';

const execFile = promisify(execFileCallback);
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const defaultOutput = path.join(
  projectRoot,
  'src/mdn/process-url/generated-official-external-redirects.ts'
);
const contentRepository = 'mdn/content';
const translatedContentRepository = 'mdn/translated-content';
const contentRedirectPath = 'files/en-us/_redirects.txt';
const translatedRedirectPathPattern = /^files\/[^/]+\/_redirects\.txt$/;
const maxResponseSize = 64 * 1024 * 1024;

function usage() {
  return `Usage: node scripts/update-official-external-redirects.mjs [options]

Options:
  --check                         Fail when the generated file is stale
  --proxy <url>                   Fetch with curl through this proxy
  --content-ref <ref>             mdn/content ref (default: main)
  --translated-content-ref <ref>  mdn/translated-content ref (default: main)
  --output <path>                 Generated TypeScript output path
  --help                          Show this help

Environment:
  MDN_REDIRECTS_PROXY   Proxy used when --proxy is omitted
  ALL_PROXY             Standard fallback proxy
  HTTPS_PROXY           Standard fallback proxy
`;
}

function takeOptionValue(argv, index, option) {
  const value = argv[index + 1];
  if (!value || value.startsWith('--')) {
    throw new TypeError(`${option} requires a value`);
  }
  return value;
}

function parseArguments(argv) {
  const args = {
    check: false,
    contentRef: 'main',
    translatedContentRef: 'main',
    output: defaultOutput,
    proxy: process.env.MDN_REDIRECTS_PROXY ||
      process.env.ALL_PROXY || process.env.HTTPS_PROXY || ''
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
    case '--check':
      args.check = true;
      break;
    case '--proxy':
      args.proxy = takeOptionValue(argv, i, arg);
      i++;
      break;
    case '--content-ref':
      args.contentRef = takeOptionValue(argv, i, arg);
      i++;
      break;
    case '--translated-content-ref':
      args.translatedContentRef = takeOptionValue(argv, i, arg);
      i++;
      break;
    case '--output':
      args.output = path.resolve(takeOptionValue(argv, i, arg));
      i++;
      break;
    case '--help':
      process.stdout.write(usage());
      process.exit(0);
      break;
    default:
      throw new TypeError(`unknown option: ${arg}`);
    }
  }
  return args;
}

function requestHeaders() {
  return {
    accept: 'text/plain, text/html;q=0.9, */*;q=0.8',
    'user-agent': 'mdn-local-official-redirect-generator'
  };
}

async function fetchWithCurl(url, headers, proxy) {
  const args = [
    '--fail',
    '--location',
    '--silent',
    '--show-error',
    '--max-time',
    '90',
    '--retry',
    '3',
    '--retry-all-errors',
    '--retry-delay',
    '1',
    '--proxy',
    proxy
  ];
  for (const [name, value] of Object.entries(headers)) {
    args.push('--header', `${name}: ${value}`);
  }
  args.push(url);
  const {stdout} = await execFile('curl', args, {
    encoding: 'utf8',
    maxBuffer: maxResponseSize
  });
  return stdout;
}

async function fetchText(url, proxy) {
  const headers = requestHeaders();
  if (proxy) {
    return fetchWithCurl(url, headers, proxy);
  }
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(90_000)
  });
  if (!response.ok) {
    throw new Error(`failed to fetch ${url}: HTTP ${response.status}`);
  }
  return response.text();
}

async function mapWithConcurrency(values, concurrency, fn) {
  const results = new Array(values.length);
  let nextIndex = 0;
  const workers = Array.from(
    {length: Math.min(concurrency, values.length)},
    async () => {
      while (nextIndex < values.length) {
        const index = nextIndex++;
        results[index] = await fn(values[index], index);
      }
    }
  );
  await Promise.all(workers);
  return results;
}

async function resolveCommit(repository, ref, proxy) {
  if (/^[0-9a-f]{40}$/i.test(ref)) {
    return ref.toLowerCase();
  }
  const refName = ref.startsWith('refs/') ? ref : `refs/heads/${ref}`;
  const env = {...process.env};
  if (proxy) {
    env.ALL_PROXY = proxy;
    env.HTTPS_PROXY = proxy;
    env.HTTP_PROXY = proxy;
  }
  const {stdout} = await execFile(
    'git',
    ['ls-remote', `https://github.com/${repository}.git`, refName],
    {
      encoding: 'utf8',
      env,
      maxBuffer: maxResponseSize
    }
  );
  const commit = stdout.trim().split(/\s+/, 1)[0];
  if (!/^[0-9a-f]{40}$/i.test(commit)) {
    throw new Error(`Git did not return a commit for ${repository}@${ref}`);
  }
  return commit.toLowerCase();
}

async function translatedRedirectPaths(commit, proxy) {
  const pageUrl = `https://github.com/${translatedContentRepository}/tree/` +
    `${commit}/files`;
  const html = await fetchText(pageUrl, proxy);
  const escapedCommit = commit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const localePattern = new RegExp(
    `/mdn/translated-content/tree/${escapedCommit}/files/([^/"?#]+)`,
    'g'
  );
  const localeNames = new Set();
  for (const match of html.matchAll(localePattern)) {
    localeNames.add(match[1]);
  }
  return Array.from(localeNames)
    .map(locale => `files/${locale}/_redirects.txt`)
    .filter(sourcePath => translatedRedirectPathPattern.test(sourcePath))
    .sort(compareStrings);
}

function rawUrl(repository, commit, filePath) {
  return `https://raw.githubusercontent.com/${repository}/${commit}/${filePath}`;
}

function isExternalTarget(target) {
  let url;
  try {
    url = new URL(target);
  } catch {
    return false;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`unsupported absolute redirect target: ${target}`);
  }
  return url.hostname !== 'developer.mozilla.org';
}

function parseRedirects(text, source) {
  const redirects = [];
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    if (!line || line.startsWith('#')) {
      continue;
    }
    const fields = line.split('\t');
    if (fields.length !== 2 || !fields[0] || !fields[1]) {
      throw new Error(`${source}:${index + 1}: expected one tab-separated rule`);
    }
    const [rawFrom, to] = fields;
    if (!rawFrom.startsWith('/')) {
      throw new Error(`${source}:${index + 1}: source must start with /`);
    }
    const external = isExternalTarget(to);
    const wildcard = rawFrom.includes('*');
    if (external && wildcard) {
      throw new Error(
        `${source}:${index + 1}: external wildcard redirects are unsupported`
      );
    }
    let from = rawFrom;
    let exactPath = !wildcard;
    if (exactPath) {
      const sourceUrl = new URL(rawFrom, 'https://developer.mozilla.org');
      if (sourceUrl.search || sourceUrl.hash) {
        if (external) {
          throw new Error(
            `${source}:${index + 1}: external source queries and fragments ` +
            'are unsupported'
          );
        }
        exactPath = false;
      } else {
        from = sourceUrl.pathname;
      }
    }
    redirects.push({
      from,
      to,
      external,
      wildcard,
      exactPath,
      source,
      line: index + 1
    });
  }
  return redirects;
}

function compareStrings(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function quoteTypeScript(value) {
  return `'${value
    .replaceAll('\\', '\\\\')
    .replaceAll('\'', '\\\'')
    .replaceAll('\r', '\\r')
    .replaceAll('\n', '\\n')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029')}'`;
}

function generateTypeScript(redirects, fallbackExclusions, sources) {
  const lines = [
    '/**',
    ' * Generated by scripts/update-official-external-redirects.mjs.',
    ' * Do not edit this file manually.',
    ` * Contains ${redirects.length} exact redirects to non-MDN origins.`,
    ` * Contains ${fallbackExclusions.length} localized fallback exclusions.`,
    ' */',
    '',
    'export const officialExternalRedirectSources = Object.freeze([',
  ];
  for (const source of sources) {
    lines.push('  Object.freeze({');
    lines.push(`    repository: ${quoteTypeScript(source.repository)},`);
    lines.push(`    commit: ${quoteTypeScript(source.commit)},`);
    lines.push('    paths: Object.freeze([');
    for (const sourcePath of source.paths) {
      lines.push(`      ${quoteTypeScript(sourcePath)},`);
    }
    lines.push('    ])');
    lines.push('  }),');
  }
  lines.push(']);');
  lines.push('');
  lines.push(`export const officialExternalRedirectCount = ${redirects.length};`);
  lines.push('');
  lines.push(
    'export const officialExternalRedirectFallbackExclusionCount = ' +
    `${fallbackExclusions.length};`
  );
  lines.push('');
  lines.push(
    'export const officialExternalRedirectFallbackExclusions: ' +
    'Readonly<Record<string, true>> ='
  );
  lines.push('  Object.freeze({');
  for (const sourcePath of fallbackExclusions) {
    lines.push(`    ${quoteTypeScript(sourcePath)}: true,`);
  }
  lines.push('  });');
  lines.push('');
  lines.push(
    'export const officialExternalRedirects: Readonly<Record<string, string>> ='
  );
  lines.push('  Object.freeze({');
  for (const redirect of redirects) {
    lines.push(
      `    ${quoteTypeScript(redirect.from)}: ${quoteTypeScript(redirect.to)},`
    );
  }
  lines.push('  });');
  lines.push('');
  return lines.join('\n');
}

async function loadRedirectSource(repository, commit, sourcePath, proxy) {
  const text = await fetchText(rawUrl(repository, commit, sourcePath), proxy);
  return parseRedirects(text, `${repository}@${commit}/${sourcePath}`);
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  const [contentCommit, translatedContentCommit] = await Promise.all([
    resolveCommit(contentRepository, args.contentRef, args.proxy),
    resolveCommit(
      translatedContentRepository,
      args.translatedContentRef,
      args.proxy
    )
  ]);
  const translatedPaths = await translatedRedirectPaths(
    translatedContentCommit,
    args.proxy
  );
  if (!translatedPaths.length) {
    throw new Error('no translated-content redirect files were found');
  }

  const sourceDescriptors = [
    {
      repository: contentRepository,
      commit: contentCommit,
      paths: [contentRedirectPath]
    },
    {
      repository: translatedContentRepository,
      commit: translatedContentCommit,
      paths: translatedPaths
    }
  ];
  const contentRedirects = await loadRedirectSource(
      contentRepository,
      contentCommit,
      contentRedirectPath,
      args.proxy
    );
  const translatedRedirects = await mapWithConcurrency(
    translatedPaths,
    3,
    sourcePath => loadRedirectSource(
      translatedContentRepository,
      translatedContentCommit,
      sourcePath,
      args.proxy
    )
  );
  const redirectGroups = [contentRedirects, ...translatedRedirects];
  const redirectMap = new Map();
  for (const redirect of redirectGroups.flat()) {
    const previous = redirectMap.get(redirect.from);
    if (previous) {
      if (previous.to !== redirect.to) {
        throw new Error(
          `conflicting source ${redirect.from} at ${previous.source}:` +
          `${previous.line} and ${redirect.source}:${redirect.line}`
        );
      }
      continue;
    }
    redirectMap.set(redirect.from, redirect);
  }
  const redirectRules = Array.from(redirectMap.values());
  const redirects = redirectRules
    .filter(redirect => redirect.external)
    .sort((a, b) => compareStrings(a.from, b.from));
  const enUsExternalSuffixes = new Set(redirects
    .filter(redirect => redirect.from.startsWith('/en-US/'))
    .map(redirect => redirect.from.slice('/en-US'.length)));
  const fallbackExclusions = redirectRules
    .filter(redirect => !redirect.external && redirect.exactPath &&
      !redirect.from.startsWith('/en-US/'))
    .map(redirect => redirect.from)
    .filter(sourcePath => {
      const localeEnd = sourcePath.indexOf('/', 1);
      return localeEnd !== -1 &&
        enUsExternalSuffixes.has(sourcePath.slice(localeEnd));
    })
    .sort(compareStrings);
  const generated = generateTypeScript(
    redirects,
    fallbackExclusions,
    sourceDescriptors
  );

  if (args.check) {
    let current = '';
    try {
      current = await fs.readFile(args.output, 'utf8');
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        throw error;
      }
    }
    if (current !== generated) {
      throw new Error(
        `${path.relative(projectRoot, args.output)} is stale; run ` +
        '`npm run update:official-redirects`'
      );
    }
    process.stdout.write(
      `official external redirects are current (${redirects.length} rules)\n`
    );
    return;
  }

  await fs.mkdir(path.dirname(args.output), {recursive: true});
  await fs.writeFile(args.output, generated, 'utf8');
  process.stdout.write(
    `wrote ${redirects.length} official external redirects to ` +
    `${path.relative(projectRoot, args.output)}\n`
  );
  process.stdout.write(`mdn/content ${contentCommit}\n`);
  process.stdout.write(`mdn/translated-content ${translatedContentCommit}\n`);
}

main().catch(error => {
  process.stderr.write(`${error?.stack || error}\n`);
  process.exitCode = 1;
});
