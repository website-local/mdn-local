import {describe, expect, test} from '@jest/globals';
import URI from 'urijs';
import type {
  DownloadResource,
  SubmitResourceFunc
} from 'website-scrap-engine/lib/life-cycle/types.js';
import type {
  PipelineExecutor
} from 'website-scrap-engine/lib/life-cycle/pipeline-executor.js';
import type {
  DownloadOptions,
  StaticDownloadOptions
} from 'website-scrap-engine/lib/options.js';
import type {Resource} from 'website-scrap-engine/lib/resource.js';
import {ResourceType} from 'website-scrap-engine/lib/resource.js';
import {
  findWorkletModuleReferences,
  processWorkletModules
} from '../../src/mdn/process-worklet-modules.js';

const options: StaticDownloadOptions = {
  localRoot: '/tmp/dummy',
  maxDepth: 2,
  concurrency: 1,
  encoding: {} as DownloadOptions['encoding'],
  meta: {}
};

function downloadResource(
  source: string,
  url = 'https://developer.mozilla.org/mdn-github-io/demo/script.js'
): DownloadResource {
  return {
    type: ResourceType.Binary,
    depth: 1,
    encoding: 'utf8',
    url,
    rawUrl: url,
    downloadLink: url,
    refUrl: url,
    savePath: 'developer.mozilla.org/mdn-github-io/demo/script.js',
    refSavePath: 'developer.mozilla.org/mdn-github-io/demo/index.html',
    localRoot: '/tmp/dummy',
    replacePath: 'script.js',
    createTimestamp: 0,
    body: source,
    meta: {},
    uri: URI(url)
  };
}

function childResource(rawUrl: string, replacePath: string): Resource {
  const url = new URL(rawUrl, 'https://mdn.github.io/demo/script.js').href;
  return {
    type: ResourceType.Binary,
    depth: 2,
    encoding: 'utf8',
    url,
    rawUrl,
    downloadLink: url,
    refUrl: 'https://mdn.github.io/demo/script.js',
    savePath: `developer.mozilla.org/mdn-github-io/demo/${rawUrl}`,
    refSavePath: 'developer.mozilla.org/mdn-github-io/demo/script.js',
    localRoot: '/tmp/dummy',
    replacePath,
    createTimestamp: 0,
    meta: {},
    uri: URI(url)
  };
}

describe('process-worklet-modules', () => {
  test('find paint and audio worklet string literals only', () => {
    const source = [
      'const fake = "CSS.paintWorklet.addModule(\\"from-string.js\\")";',
      '// CSS.paintWorklet.addModule("from-line-comment.js");',
      '/* audioContext.audioWorklet.addModule("from-comment.js"); */',
      'CSS.paintWorklet.addModule("./header-highlight.js");',
      'audioContext.audioWorklet.addModule(\'hiss-generator.js\');',
      'CSS.paintWorklet.addModule(moduleUrl);',
      'other.addModule("unrelated.js");'
    ].join('\n');

    expect(findWorkletModuleReferences(source).map(({url}) => url)).toEqual([
      './header-highlight.js',
      'hiss-generator.js'
    ]);
  });

  test('submit each discovered module once and rewrite every literal', async () => {
    const source = [
      'CSS.paintWorklet.addModule("./paint.js");',
      'CSS.paintWorklet.addModule(\'./paint.js\');'
    ].join('\n');
    const created: string[] = [];
    const submitted: Resource[] = [];
    const pipeline = {
      createAndProcessResource: async (rawUrl: string) => {
        created.push(rawUrl);
        return childResource(rawUrl, '../assets/paint.js');
      }
    } as unknown as PipelineExecutor;
    const submit: SubmitResourceFunc = value => {
      submitted.push(...Array.isArray(value) ? value : [value]);
    };
    const result = await processWorkletModules(
      downloadResource(source), submit, options, pipeline);

    expect(created).toEqual(['./paint.js']);
    expect(submitted).toHaveLength(1);
    expect(result.body).toBe([
      'CSS.paintWorklet.addModule("../assets/paint.js");',
      'CSS.paintWorklet.addModule(\'../assets/paint.js\');'
    ].join('\n'));
  });

  test('ignore non-JavaScript resources', async () => {
    const source = 'CSS.paintWorklet.addModule("paint.js");';
    const resource = downloadResource(
      source,
      'https://developer.mozilla.org/mdn-github-io/demo/data.json'
    );
    const created: string[] = [];
    const pipeline = {
      createAndProcessResource: async (rawUrl: string) => {
        created.push(rawUrl);
        return childResource(rawUrl, rawUrl);
      }
    } as unknown as PipelineExecutor;

    const result = await processWorkletModules(
      resource, () => void 0, options, pipeline);
    expect(created).toEqual([]);
    expect(result.body).toBe(source);
  });
});
