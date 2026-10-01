import {describe, expect, test} from '@jest/globals';
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {selectReleaseArtifacts} from '../../scripts/select-release-artifacts.mjs';

const repository = 'website-local/mdn-local';
const run = {
  id: 123,
  repository: {full_name: repository},
  path: '.github/workflows/ci-download.yml',
  status: 'completed',
  conclusion: 'success',
  head_sha: 'a'.repeat(40),
};
const artifact = (locale: string, id: number, date = '20261001') => ({
  id,
  name: `developer.mozilla.org_${date}_${locale}`,
  expired: false,
  size_in_bytes: 1024,
  archive_download_url: `https://api.github.com/repos/${repository}/actions/artifacts/${id}/zip`,
});
const english = artifact('en-US', 1);
const chinese = artifact('zh-CN', 2);
const select = (artifacts: typeof english[]) =>
  selectReleaseArtifacts(run, {artifacts}, repository, '123');

describe('release artifact selection', () => {
  test('selects both locale archives and ignores log artifacts', () => {
    const logs = {...english, name: 'logs_developer.mozilla.org_20261001_en-US'};
    expect(select([logs, chinese, english])).toEqual([english, chinese]);
  });

  test.each([
    {status: 'in_progress'},
    {conclusion: 'failure'},
    {conclusion: 'cancelled'},
    {path: '.github/workflows/node.js.yml'},
    {repository: {full_name: 'another/repository'}},
    {id: 456},
    {head_sha: ''},
  ])('rejects an unsuitable source run: %j', patch => {
    expect(() => selectReleaseArtifacts(
      {...run, ...patch}, {artifacts: [english, chinese]}, repository, '123',
    )).toThrow('download run');
  });

  test.each([
    ['no archives', []],
    ['missing Chinese archive', [english]],
    ['duplicate English archives', [english, artifact('en-US', 3)]],
    ['mixed dates', [english, artifact('zh-CN', 2, '20260930')]],
    ['expired archive', [english, {...chinese, expired: true}]],
    ['empty archive', [{...english, size_in_bytes: 0}, chinese]],
    ['unsupported locale', [english, artifact('fr', 3)]],
    ['unexpected download URL', [english, {...chinese, archive_download_url: 'https://example.com/archive.zip'}]],
  ])('rejects %s', (_, artifacts) => {
    expect(() => select(artifacts)).toThrow();
  });

  test.each([
    {artifacts: [english, chinese], status: 0},
    {artifacts: [english], status: 1},
  ])('CLI exits $status for the selected archives', ({artifacts, status}) => {
    const directory = mkdtempSync(path.join(tmpdir(), 'mdn-release-artifacts-'));
    try {
      writeFileSync(path.join(directory, 'run.json'), JSON.stringify(run));
      writeFileSync(path.join(directory, 'artifacts.json'), JSON.stringify({artifacts}));
      const result = spawnSync(process.execPath, [
        fileURLToPath(new URL('../../scripts/select-release-artifacts.mjs', import.meta.url)),
        'run.json', 'artifacts.json', repository, '123',
      ], {cwd: directory, encoding: 'utf8', timeout: 5000});
      expect(result.error).toBeUndefined();
      expect(result.status).toBe(status);
      if (status === 0) {
        expect(result.stdout.trim().split('\n'))
          .toEqual([english.archive_download_url, chinese.archive_download_url]);
        expect(result.stderr).toBe('');
      } else {
        expect(result.stdout).toBe('');
        expect(result.stderr).toContain('Both en-US and zh-CN');
      }
    } finally {
      rmSync(directory, {recursive: true, force: true});
    }
  });
});
