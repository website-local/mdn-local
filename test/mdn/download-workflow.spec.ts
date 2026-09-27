import {describe, expect, test} from '@jest/globals';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {transpileModule, ModuleKind, ScriptTarget} from 'typescript';

const workflow = readFileSync(new URL('../../.github/workflows/ci-download.yml', import.meta.url), 'utf8');
const generatedScript = workflow.match(/cat << EOF > src\/mdn\/run-downloader\.ts\r?\n([\s\S]*?)\r?\n\s*EOF/);
if (!generatedScript) throw new Error('Cannot find the download workflow runner');
const source = generatedScript[1].replace(/^\s*import createDownloader from '\.\/mdn-downloader\.js';\s*\r?\n/m, '');
const runner = transpileModule(source, {
  compilerOptions: {module: ModuleKind.ES2022, target: ScriptTarget.ES2020},
}).outputText;

describe('download workflow exit status', () => {
  test.each([
    {failure: '', status: 0, steps: ['create', 'idle', 'dispose']},
    {failure: 'create', status: 1, steps: ['create']},
    {failure: 'idle', status: 1, steps: ['create', 'idle']},
    {failure: 'dispose', status: 1, steps: ['create', 'idle', 'dispose']},
  ])('exits with $status after "$failure"', ({failure, status, steps}) => {
    // Execute the actual generated runner in a child Node process. Only its
    // downloader is replaced; no network request or filesystem write occurs.
    const result = spawnSync(process.execPath, ['--input-type=module', '--eval', `
      const failure = ${JSON.stringify(failure)};
      async function step(name) {
        console.log(name);
        if (name === failure) throw new Error('Failed at ' + name);
      }
      async function createDownloader() {
        await step('create');
        return {onIdle: () => step('idle'), dispose: () => step('dispose')};
      }
      ${runner}
    `], {encoding: 'utf8', timeout: 5000});

    expect(result.error).toBeUndefined();
    expect(result.signal).toBeNull();
    expect(result.status).toBe(status);
    expect(result.stdout.trim().split(/\r?\n/)).toEqual(steps);
    if (failure) expect(result.stderr).toContain(`Failed at ${failure}`);
    else expect(result.stderr).toBe('');
  });
});
