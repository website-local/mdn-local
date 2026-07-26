import type {
  DownloadResource,
  SubmitResourceFunc
} from 'website-scrap-engine/lib/life-cycle/types.js';
import type {
  PipelineExecutor
} from 'website-scrap-engine/lib/life-cycle/pipeline-executor.js';
import type {StaticDownloadOptions} from 'website-scrap-engine/lib/options.js';
import type {Resource} from 'website-scrap-engine/lib/resource.js';
import {ResourceType} from 'website-scrap-engine/lib/resource.js';
import {toString} from 'website-scrap-engine/lib/util.js';

type Quote = '\'' | '"';

export interface WorkletModuleReference {
  url: string;
  valueStart: number;
  valueEnd: number;
  quote: Quote;
}

interface StringLiteral extends WorkletModuleReference {
  nextIndex: number;
}

interface Replacement {
  start: number;
  end: number;
  value: string;
}

const JS_PATH = /\.(?:js|mjs|jsm)$/i;
const IDENTIFIER_PART = /[$\w]/;
const HEX_2 = /^[\da-f]{2}$/i;
const HEX_4 = /^[\da-f]{4}$/i;
const WORKLET_CALL = /(?:CSS\s*\.\s*paintWorklet|[$A-Z_a-z][$\w]*(?:\s*\.\s*[$A-Z_a-z][$\w]*)*\s*\.\s*audioWorklet)\s*\.\s*addModule\s*\(/y;

function skipQuotedText(
  source: string,
  index: number,
  quote: string
): number {
  for (let i = index + 1; i < source.length; i++) {
    if (source[i] === '\\') {
      i++;
    } else if (source[i] === quote) {
      return i + 1;
    }
  }
  return source.length;
}

function skipLineComment(source: string, index: number): number {
  const lineEnd = source.indexOf('\n', index + 2);
  return lineEnd === -1 ? source.length : lineEnd + 1;
}

function skipBlockComment(source: string, index: number): number {
  const commentEnd = source.indexOf('*/', index + 2);
  return commentEnd === -1 ? source.length : commentEnd + 2;
}

function skipTrivia(source: string, index: number): number {
  let i = index;
  while (i < source.length) {
    if (/\s/.test(source[i])) {
      i++;
    } else if (source.startsWith('//', i)) {
      i = skipLineComment(source, i);
    } else if (source.startsWith('/*', i)) {
      i = skipBlockComment(source, i);
    } else {
      break;
    }
  }
  return i;
}

function readStringLiteral(source: string, index: number): StringLiteral | void {
  const quote = source[index];
  if (quote !== '\'' && quote !== '"') return;

  let value = '';
  for (let i = index + 1; i < source.length; i++) {
    const char = source[i];
    if (char === quote) {
      return {
        url: value,
        valueStart: index + 1,
        valueEnd: i,
        quote,
        nextIndex: i + 1
      };
    }
    if (char !== '\\') {
      value += char;
      continue;
    }

    i++;
    if (i >= source.length) return;
    const escaped = source[i];
    if (escaped === '\n') continue;
    if (escaped === '\r') {
      if (source[i + 1] === '\n') i++;
      continue;
    }
    const simpleEscapes: Record<string, string> = {
      b: '\b',
      f: '\f',
      n: '\n',
      r: '\r',
      t: '\t',
      v: '\v'
    };
    if (simpleEscapes[escaped] !== undefined) {
      value += simpleEscapes[escaped];
      continue;
    }
    if (escaped === 'x') {
      const hex = source.slice(i + 1, i + 3);
      if (HEX_2.test(hex)) {
        value += String.fromCharCode(parseInt(hex, 16));
        i += 2;
        continue;
      }
    }
    if (escaped === 'u') {
      const hex = source.slice(i + 1, i + 5);
      if (HEX_4.test(hex)) {
        value += String.fromCharCode(parseInt(hex, 16));
        i += 4;
        continue;
      }
    }
    value += escaped;
  }
}

export function findWorkletModuleReferences(
  source: string
): WorkletModuleReference[] {
  if (!source.includes('Worklet') || !source.includes('addModule')) return [];

  const references: WorkletModuleReference[] = [];
  for (let i = 0; i < source.length;) {
    const char = source[i];
    if (char === '\'' || char === '"' || char === '`') {
      i = skipQuotedText(source, i, char);
      continue;
    }
    if (source.startsWith('//', i)) {
      i = skipLineComment(source, i);
      continue;
    }
    if (source.startsWith('/*', i)) {
      i = skipBlockComment(source, i);
      continue;
    }
    if (!/[A-Z_a-z$]/.test(char) ||
      i > 0 && IDENTIFIER_PART.test(source[i - 1])) {
      i++;
      continue;
    }

    WORKLET_CALL.lastIndex = i;
    const match = WORKLET_CALL.exec(source);
    if (!match) {
      i++;
      continue;
    }
    const literalStart = skipTrivia(source, WORKLET_CALL.lastIndex);
    const literal = readStringLiteral(source, literalStart);
    if (!literal) {
      i = WORKLET_CALL.lastIndex;
      continue;
    }
    references.push(literal);
    i = literal.nextIndex;
  }
  return references;
}

function escapeStringLiteral(value: string, quote: Quote): string {
  let escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  escaped = escaped.split(quote).join(`\\${quote}`);
  return escaped;
}

export async function processWorkletModules(
  res: DownloadResource,
  submit: SubmitResourceFunc,
  options: StaticDownloadOptions,
  pipeline: PipelineExecutor
): Promise<DownloadResource> {
  if (res.type !== ResourceType.Binary ||
    !JS_PATH.test(res.uri?.path() || '')) {
    return res;
  }

  const source = toString(
    res.body,
    res.encoding || options.encoding[ResourceType.Binary] || 'utf8'
  );
  const references = findWorkletModuleReferences(source);
  if (!references.length) return res;

  const replacePaths = new Map<string, string | null>();
  const submittedUrls = new Set<string>();
  const resources: Resource[] = [];
  for (const reference of references) {
    if (replacePaths.has(reference.url)) continue;
    const resource = await pipeline.createAndProcessResource(
      reference.url,
      ResourceType.Binary,
      res.depth + 1,
      null,
      res
    );
    replacePaths.set(reference.url, resource?.replacePath || null);
    if (resource && !resource.shouldBeDiscardedFromDownload &&
      !submittedUrls.has(resource.url)) {
      submittedUrls.add(resource.url);
      resources.push(resource);
    }
  }

  const replacements: Replacement[] = [];
  for (const reference of references) {
    const replacePath = replacePaths.get(reference.url);
    if (replacePath && replacePath !== reference.url) {
      replacements.push({
        start: reference.valueStart,
        end: reference.valueEnd,
        value: escapeStringLiteral(replacePath, reference.quote)
      });
    }
  }
  replacements.sort((a, b) => b.start - a.start);
  let processedSource = source;
  for (const replacement of replacements) {
    processedSource = processedSource.slice(0, replacement.start) +
      replacement.value + processedSource.slice(replacement.end);
  }
  if (processedSource !== source) res.body = processedSource;
  if (resources.length) submit(resources);
  return res;
}
