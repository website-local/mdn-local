import {describe, expect, test} from '@jest/globals';
import {load} from 'cheerio';
import type {DownloadResource} from 'website-scrap-engine/lib/life-cycle/types.js';
import type {PipelineExecutor} from 'website-scrap-engine/lib/life-cycle/pipeline-executor.js';
import type {StaticDownloadOptions} from 'website-scrap-engine/lib/options.js';
import {downloadAndRenderCompatibilityData} from '../../../src/mdn/process-html/process-compat-table.js';

describe('compatibility HTML processing', () => {
  test.each([
    ['https://developer.mozilla.org/fr/docs/Web/CSS/foo', undefined],
    ['https://developer.mozilla.org/fr/docs/Web/CSS/old-foo', 'https://developer.mozilla.org/fr/docs/Web/CSS/foo'],
  ])('uses the final document pathname for %s and replaces the lazy widget', async (url, redirectedUrl) => {
    const $ = load('<mdn-compat-table-lazy query="css.properties.foo" locale="fr"></mdn-compat-table-lazy>');
    const page = {url, redirectedUrl, depth: 0} as DownloadResource;
    const support = {chrome: {version_added: '1'}};
    const json = {
      data: {
        __compat: {support},
        child: {__compat: {support, mdn_url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/foo'}},
      },
      browsers: {chrome: {name: 'Chrome', type: 'desktop', releases: {'1': {status: 'current'}}}},
    };
    const requested: string[] = [];
    const pipeline = {
      createAndProcessResource: async (url: string) => {
        requested.push(url);
        return {url, body: JSON.stringify(json)};
      },
      download: async (resource: DownloadResource) => resource,
    } as unknown as PipelineExecutor;
    await downloadAndRenderCompatibilityData(
      page, () => undefined, pipeline, {meta: {}} as StaticDownloadOptions, $, 'fr',
    );
    expect(requested).toEqual(['https://developer.mozilla.org/bcd/api/v0/current/css.properties.foo.json']);
    expect($('mdn-compat-table-lazy')).toHaveLength(0);
    expect($('.lazy-compat-table .bc-table')).toHaveLength(1);
    expect($('.lazy-compat-table .bc-settings')).toHaveLength(1);
    expect($('a.bc-table-row-header')).toHaveLength(0);
    expect($('.bc-feature').text()).toContain('child');
  });
});
