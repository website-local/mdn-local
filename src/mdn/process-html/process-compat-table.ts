// noinspection ES6PreferShortImport

import type {HTTPError} from 'got';
import {
  error as errorLogger,
  notFound
} from 'website-scrap-engine/lib/logger/logger.js';
import type {Cheerio, CheerioStatic} from 'website-scrap-engine/lib/types.js';
import type {
  PipelineExecutor
} from 'website-scrap-engine/lib/life-cycle/pipeline-executor.js';
import type {
  DownloadResource,
  SubmitResourceFunc
} from 'website-scrap-engine/lib/life-cycle/types.js';
import type {Resource} from 'website-scrap-engine/lib/resource.js';
import {ResourceType} from 'website-scrap-engine/lib/resource.js';
import {toString} from 'website-scrap-engine/lib/util.js';
import type {
  Compat
} from '../browser-compatibility-table/index.js';
import {
  renderCompatibilityTable
} from '../browser-compatibility-table/index.js';
import type {StaticDownloadOptions} from 'website-scrap-engine/lib/options.js';

export interface MdnCompatibilityData {
  dataURL?: string
  locale?: string
  query?: string
}

/**
 * Custom interface to make sure dataURL and id is not empty
 */

export interface MdnCompatibilityDataWithUrl extends MdnCompatibilityData {
  dataURL: string
}

/// endregion type def

export interface MdnCompatibilityRenderingContext {
  res: Resource;
  data: MdnCompatibilityDataWithUrl;
  element: Cheerio;
}

export async function downloadAndRenderCompatibilityData(
  res: DownloadResource,
  submit: SubmitResourceFunc,
  pipeline: PipelineExecutor,
  options: StaticDownloadOptions,
  $: CheerioStatic,
  locale: string
): Promise<void> {
  const elements = $('mdn-compat-table-lazy');
  if (!elements.length) return;
  const mdnHost: string = options.meta.host as string | void
    || 'developer.mozilla.org';
  const contexts: MdnCompatibilityRenderingContext[] = [];

  for (let i = 0, length = elements.length; i < length; i++) {
    const el = $(elements[i]);
    const locale = el.attr('locale');
    const query = el.attr('query');
    if (!query) {
      errorLogger.info('Invalid bcd without a query',
        res.url, locale, query);
      continue;
    }
    const dataUrl = `https://${mdnHost}/bcd/api/v0/current/${query}.json`;
    const resource = await pipeline.createAndProcessResource(
      dataUrl,
      ResourceType.Binary,
      res.depth + 1,
      null,
      res
    );
    if (!resource) continue;
    if (!resource.shouldBeDiscardedFromDownload) {
      contexts.push({
        res: resource,
        element: el,
        data: {
          locale,
          query,
          dataURL: dataUrl,
        }
      });
    }
  }

  if (!contexts.length) {
    return;
  }

  const downloadResources = await Promise.all(contexts.map(c => {
    return Promise.resolve(pipeline.download(c.res)).then(res => {
      if (res) {
        c.res = res;
      }
      return c;
    }, err => {
      if (err && (err as {name?: string | void}).name === 'HTTPError' &&
          (err as HTTPError)?.response?.statusCode === 404) {
        notFound.warn('Not found yari bcd',
          res.url,
          c.data?.locale,
          c.data?.query,
          c.data?.dataURL);
      } else {
        errorLogger.warn('Error downloading yari bcd',
          res.url,
          c.data?.locale,
          c.data?.query,
          c.data?.dataURL, err.code);
      }
      return c;
    });
  }));

  for (let i = 0, el: Cheerio, data: MdnCompatibilityDataWithUrl;
    i < downloadResources.length; i++) {
    const r = downloadResources[i];
    data = contexts[i].data;
    el = contexts[i].element;
    if (!r) {
      continue;
    }
    if (!r.res.body) {
      // fail to download, is MdnYariCompatibilityRenderingContext
      el.html(`<div class="notecard warning"><p>No compatibility data found for <code>${
        (r as MdnCompatibilityRenderingContext)?.data?.query
      }</code>.</p></div>`);
      el.prop('tagName', 'div');
      continue;
    }
    const bcdRes = r.res as DownloadResource;
    submit(bcdRes);
    // note: keep the original body of resource
    const jsonData: Compat =
      JSON.parse(toString(bcdRes.body, bcdRes.encoding));

    const html = renderCompatibilityTable(
      jsonData, data.query || '', locale);
    el.html(html);
    // make this lazy-compat-table plain element
    if (el.is('lazy-compat-table') || el.is('mdn-compat-table-lazy')) {
      el.prop('tagName', 'div').addClass('lazy-compat-table');
    }
  }
}
