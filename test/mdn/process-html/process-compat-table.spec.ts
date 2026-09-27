import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals';
import {load} from 'cheerio';
import type {DownloadResource, SubmitResourceFunc} from 'website-scrap-engine/lib/life-cycle/types.js';
import type {PipelineExecutor} from 'website-scrap-engine/lib/life-cycle/pipeline-executor.js';
import type {StaticDownloadOptions} from 'website-scrap-engine/lib/options.js';
import type {Resource} from 'website-scrap-engine/lib/resource.js';
import {error as errorLogger, notFound} from 'website-scrap-engine/lib/logger/logger.js';
import {downloadAndRenderCompatibilityData} from '../../../src/mdn/process-html/process-compat-table.js';

const page = {url: 'https://developer.mozilla.org/fr/docs/Web/CSS/foo', depth: 0} as DownloadResource;
const options = {meta: {}} as StaticDownloadOptions;
const support = {chrome: {version_added: '1'}};
const json = JSON.stringify({
  data: {
    __compat: {support},
    child: {__compat: {support, mdn_url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/foo'}},
  },
  browsers: {chrome: {name: 'Chrome', type: 'desktop', releases: {'1': {status: 'current'}}}},
});
const jsonBytes = Uint8Array.from(Buffer.from(json));
const paddedJsonBytes = Uint8Array.from(Buffer.from(`!${json}!`));

function createPipeline() {
  const createAndProcessResource = jest.fn(async (url: string): Promise<Resource | undefined> => ({url} as Resource));
  const download = jest.fn(async (resource: Resource): Promise<DownloadResource | undefined> => (
    {...resource, body: json} as DownloadResource
  ));
  return {
    createAndProcessResource,
    download,
    pipeline: {createAndProcessResource, download} as unknown as PipelineExecutor,
  };
}

function widgets(queries: string[]) {
  return load(queries.map((query, index) => `
    <section id="table-${index}">
      <mdn-compat-table-lazy query="${query}" locale="fr"></mdn-compat-table-lazy>
    </section>`).join(''));
}

describe('compatibility HTML processing', () => {
  beforeEach(() => {
    jest.spyOn(errorLogger, 'info').mockImplementation(() => undefined);
    jest.spyOn(errorLogger, 'warn').mockImplementation(() => undefined);
    jest.spyOn(errorLogger, 'error').mockImplementation(() => undefined);
    jest.spyOn(notFound, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  test.each([
    ['https://developer.mozilla.org/fr/docs/Web/CSS/foo', undefined],
    ['https://developer.mozilla.org/fr/docs/Web/CSS/old-foo', 'https://developer.mozilla.org/fr/docs/Web/CSS/foo'],
  ])('uses the final document pathname for %s and replaces the lazy widget', async (url, redirectedUrl) => {
    const $ = widgets(['css.properties.foo']);
    const {pipeline, createAndProcessResource} = createPipeline();
    const submit = jest.fn<SubmitResourceFunc>();
    await downloadAndRenderCompatibilityData(
      {...page, url, redirectedUrl}, submit, pipeline, options, $, 'fr',
    );
    expect(createAndProcessResource.mock.calls.map(([url]) => url))
      .toEqual(['https://developer.mozilla.org/bcd/api/v0/current/css.properties.foo.json']);
    expect($('mdn-compat-table-lazy')).toHaveLength(0);
    expect($('.lazy-compat-table .bc-table')).toHaveLength(1);
    expect($('.lazy-compat-table .bc-settings')).toHaveLength(1);
    expect($('a.bc-table-row-header')).toHaveLength(0);
    expect($('.bc-feature').text()).toContain('child');
    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit.mock.calls[0][0].body).toBe(json);
  });

  test('keeps history and legend IDs unique across tables, including repeated queries', async () => {
    const $ = widgets(['css.properties.foo', 'css.properties.bar', 'css.properties.foo']);
    const {pipeline} = createPipeline();
    await downloadAndRenderCompatibilityData(page, () => undefined, pipeline, options, $, 'fr');

    expect($('.bc-table')).toHaveLength(3);
    const ids = $('[id]').map((_, el) => $(el).attr('id')).get();
    expect(new Set(ids).size).toBe(ids.length);
    $('.bc-table').each((_, table) => {
      const buttons = $(table).find('[aria-controls]');
      expect(buttons.length).toBeGreaterThan(0);
      buttons.each((_, button) => {
        const target = $(button).attr('aria-controls');
        const timeline = $('[id]').filter((_, el) => $(el).attr('id') === target);
        expect(timeline).toHaveLength(1);
        expect(timeline.hasClass('timeline')).toBe(true);
        expect(timeline.closest('.bc-table')[0]).toBe(table);
      });
    });
  });

  test.each([
    {label: 'a Buffer', body: Buffer.from(json)},
    {label: 'an ArrayBuffer', body: jsonBytes.buffer},
    {label: 'a Uint8Array with an offset', body: paddedJsonBytes.subarray(1, -1)},
    {label: 'a DataView with an offset', body: new DataView(paddedJsonBytes.buffer, 1, jsonBytes.byteLength)},
  ])('renders $label without replacing the submitted body', async ({body}) => {
    const $ = widgets(['css.properties.foo']);
    const {pipeline, download} = createPipeline();
    download.mockImplementationOnce(async resource => ({...resource, body} as DownloadResource));
    const submit = jest.fn<SubmitResourceFunc>();

    await downloadAndRenderCompatibilityData(page, submit, pipeline, options, $, 'fr');

    expect($('.bc-table')).toHaveLength(1);
    expect($('.bc-feature').text()).toContain('child');
    expect($('.notecard.warning')).toHaveLength(0);
    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit.mock.calls[0][0].body).toBe(body);
  });

  test.each([
    {label: 'malformed JSON', body: '{"data":'},
    {label: 'null JSON', body: 'null'},
    {label: 'missing compatibility data', body: '{"browsers":{}}'},
    {label: 'an empty response', body: ''},
    {label: 'an empty buffer', body: Buffer.alloc(0)},
    {label: 'an empty ArrayBuffer', body: new ArrayBuffer(0)},
    {label: 'an empty DataView', body: new DataView(new ArrayBuffer(0))},
  ])('keeps later tables usable after $label', async ({body}) => {
    const $ = widgets(['css.properties.broken', 'css.properties.foo']);
    const {pipeline, download} = createPipeline();
    download.mockImplementationOnce(async resource => ({...resource, body} as DownloadResource));
    const submit = jest.fn<SubmitResourceFunc>();

    await expect(downloadAndRenderCompatibilityData(page, submit, pipeline, options, $, 'fr'))
      .resolves.toBeUndefined();

    expect($('mdn-compat-table-lazy')).toHaveLength(0);
    expect($('#table-0 .notecard.warning code').text()).toBe('css.properties.broken');
    expect($('#table-0 .bc-table')).toHaveLength(0);
    expect($('#table-1 .bc-table')).toHaveLength(1);
    expect(submit.mock.calls.map(([resource]) => resource.url))
      .toEqual(['https://developer.mozilla.org/bcd/api/v0/current/css.properties.foo.json']);
    expect(errorLogger.error).toHaveBeenCalledTimes(typeof body === 'string' && body.length ? 1 : 0);
  });

  test.each([
    {
      label: 'a missing BCD response',
      reason: Object.assign(new Error('Not found'), {name: 'HTTPError', response: {statusCode: 404}}),
      isNotFound: true,
    },
    {label: 'a request timeout', reason: Object.assign(new Error('Timeout'), {code: 'ETIMEDOUT'}), isNotFound: false},
    {label: 'a rejection without an error object', reason: undefined, isNotFound: false},
  ])('keeps later tables usable after $label', async ({reason, isNotFound}) => {
    const $ = widgets(['css.properties.broken', 'css.properties.foo']);
    const {pipeline, download} = createPipeline();
    download.mockRejectedValueOnce(reason);
    const submit = jest.fn<SubmitResourceFunc>();

    await expect(downloadAndRenderCompatibilityData(page, submit, pipeline, options, $, 'fr'))
      .resolves.toBeUndefined();

    expect($('#table-0 .notecard.warning code').text()).toBe('css.properties.broken');
    expect($('#table-1 .bc-table')).toHaveLength(1);
    expect($('mdn-compat-table-lazy')).toHaveLength(0);
    expect(submit).toHaveBeenCalledTimes(1);
    expect(isNotFound ? notFound.warn : errorLogger.warn).toHaveBeenCalledTimes(1);
  });

  test('keeps resources paired with their widgets when earlier resources are skipped', async () => {
    const $ = widgets(['css.properties.dropped', '', 'css.properties.discarded', 'css.properties.foo']);
    const {pipeline, createAndProcessResource, download} = createPipeline();
    createAndProcessResource.mockResolvedValueOnce(undefined);
    createAndProcessResource.mockResolvedValueOnce({shouldBeDiscardedFromDownload: true} as Resource);
    await downloadAndRenderCompatibilityData(page, () => undefined, pipeline, options, $, 'fr');

    expect(createAndProcessResource.mock.calls.map(([url]) => url)).toEqual([
      'https://developer.mozilla.org/bcd/api/v0/current/css.properties.dropped.json',
      'https://developer.mozilla.org/bcd/api/v0/current/css.properties.discarded.json',
      'https://developer.mozilla.org/bcd/api/v0/current/css.properties.foo.json',
    ]);
    expect(download).toHaveBeenCalledTimes(1);
    expect($('.bc-table')).toHaveLength(1);
    expect($('#table-3 .bc-table')).toHaveLength(1);
  });
});
