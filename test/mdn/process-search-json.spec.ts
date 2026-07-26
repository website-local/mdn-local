import {describe, expect, test} from '@jest/globals';
import type {
  DownloadOptions,
  StaticDownloadOptions
} from 'website-scrap-engine/lib/options.js';
import type {
  DownloadResource,
  SubmitResourceFunc
} from 'website-scrap-engine/lib/life-cycle/types.js';
import type {
  PipelineExecutor
} from 'website-scrap-engine/lib/life-cycle/pipeline-executor.js';
import type {Resource} from 'website-scrap-engine/lib/resource.js';
import {ResourceType} from 'website-scrap-engine/lib/resource.js';
import URI from 'urijs';
import {processSearchJson} from '../../src/mdn/process-search-json.js';

const options: StaticDownloadOptions = {
  localRoot: '/tmp/dummy',
  maxDepth: 1,
  concurrency: 1,
  encoding: {} as DownloadOptions['encoding'],
  meta: {
    locale: 'en-US'
  }
};

describe('process-search-json', () => {
  test('rewrites official redirect entries without submitting downloads', async () => {
    const memoryUrl =
      'https://developer.mozilla.org/en-US/docs/Tools/Memory';
    const abortUrl =
      'https://developer.mozilla.org/en-US/docs/Web/API/AbortController';
    const externalUrl =
      'https://firefox-source-docs.mozilla.org/devtools-user/memory/index.html';
    const res = {
      type: ResourceType.Binary,
      depth: 0,
      encoding: 'utf8',
      url: 'https://developer.mozilla.org/en-US/search-index.json',
      rawUrl: 'https://developer.mozilla.org/en-US/search-index.json',
      downloadLink: 'https://developer.mozilla.org/en-US/search-index.json',
      refUrl: 'https://developer.mozilla.org/en-US/search-index.json',
      savePath: 'developer.mozilla.org/en-US/search-index.json',
      refSavePath: 'developer.mozilla.org/en-US/search-index.json',
      localRoot: '/tmp/dummy',
      replacePath: 'search-index.json',
      createTimestamp: Date.now(),
      body: JSON.stringify([
        {title: 'Memory', url: memoryUrl},
        {title: 'AbortController', url: abortUrl}
      ]),
      meta: {},
      uri: URI('https://developer.mozilla.org/en-US/search-index.json')
    } as DownloadResource;
    const normalResource = {
      shouldBeDiscardedFromDownload: false,
      meta: {},
      url: abortUrl
    } as unknown as Resource;
    const externalResource = {
      shouldBeDiscardedFromDownload: true,
      replacePath: externalUrl,
      meta: {
        mdnOfficialExternalRedirect: {
          matchedUrl: memoryUrl,
          target: externalUrl
        }
      },
      url: memoryUrl
    } as unknown as Resource;
    const pipeline = {
      createAndProcessResource: async (url: string) =>
        url === memoryUrl ? externalResource : normalResource
    } as unknown as PipelineExecutor;
    const submitted: Resource[] = [];
    const submit: SubmitResourceFunc = resources => {
      submitted.push(...(Array.isArray(resources) ? resources : [resources]));
    };

    await processSearchJson(res, submit, options, pipeline);

    expect(JSON.parse(res.body as string)).toEqual([
      {title: 'Memory', url: externalUrl},
      {title: 'AbortController', url: abortUrl}
    ]);
    expect(submitted).toEqual([normalResource]);
  });
});
