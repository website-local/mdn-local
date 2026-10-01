import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export function selectReleaseArtifacts(run, response, repository, runId) {
  if (!/^\d+$/.test(runId) || String(run.id) !== runId ||
    run.repository?.full_name !== repository ||
    run.path !== '.github/workflows/ci-download.yml' ||
    run.status !== 'completed' || run.conclusion !== 'success' ||
    !/^[a-f0-9]{40}$/i.test(run.head_sha)) {
    throw new Error('Select a successful, completed download run from this repository');
  }
  const artifacts = response.artifacts?.filter(artifact =>
    artifact.name.startsWith('developer.mozilla.org_')) || [];
  if (artifacts.length !== 2) {
    throw new Error('Both en-US and zh-CN download artifacts are required');
  }
  const locales = new Set();
  const dates = new Set();
  for (const artifact of artifacts) {
    const match = /^developer\.mozilla\.org_(\d{8})_(en-US|zh-CN)$/.exec(artifact.name);
    if (!match || artifact.expired || !(artifact.size_in_bytes > 0)) {
      throw new Error(`Invalid or expired download artifact: ${artifact.name}`);
    }
    locales.add(match[2]);
    dates.add(match[1]);
    const expectedUrl = `https://api.github.com/repos/${repository}/actions/artifacts/${artifact.id}/zip`;
    if (artifact.archive_download_url !== expectedUrl) {
      throw new Error(`Unexpected artifact download URL: ${artifact.name}`);
    }
  }
  if (locales.size !== 2 || dates.size !== 1) {
    throw new Error('Download artifacts must contain both locales from the same build date');
  }
  return artifacts.sort((a, b) => a.name.localeCompare(b.name));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [runFile, artifactsFile, repository, runId] = process.argv.slice(2);
  try {
    const [run, response] = await Promise.all([runFile, artifactsFile]
      .map(async file => JSON.parse(await readFile(file, 'utf8'))));
    for (const artifact of selectReleaseArtifacts(run, response, repository, runId)) {
      process.stdout.write(`${artifact.archive_download_url}\n`);
    }
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
