import {
  error as errorLogger
} from 'website-scrap-engine/lib/logger/logger';
import type {Cheerio, CheerioStatic} from 'website-scrap-engine/lib/types';
import type {
  PipelineExecutor
} from 'website-scrap-engine/lib/life-cycle/pipeline-executor';
import type {
  DownloadResource,
  SubmitResourceFunc
} from 'website-scrap-engine/lib/life-cycle/types';
import type {Resource} from 'website-scrap-engine/lib/resource';
import {ResourceType} from 'website-scrap-engine/lib/resource';
import {toString} from 'website-scrap-engine/lib/util';
import {
  renderYariCompatibilityTable,
  YariCompatibilityDataJson
} from '../browser-compatibility-table';

/// region type def
// See https://github.com/mdn/yari/blob/v0.2.28/client/src/document/types.tsx
// https://github.com/mdn/yari/blob/v0.2.28/client/src/document/index.tsx
type MdnYariFlaws = Record<string, unknown>;

export type MdnYariTranslation = {
  locale: string;
  url: string;
};

export type MdnYariDocParent = {
  uri: string;
  title: string;
};

export type MdnYariToc = {
  id: string;
  text: string;
};

export interface MdnYariSource {
  github_url: string;
  folder: string;
}

export interface MdnYariDocBodyProse {
  type: 'prose';
  value?: {
    content?: string;
    id?: string;
    isH3?: boolean;
    title?: string;
  }
}

export interface MdnYariCompatibilityData {
  dataURL?: string
  id?: string
  isH3?: boolean
  query?: string
  title?: string
}

export interface MdnYariDocBodyCompatibility {
  type: 'browser_compatibility';
  value?: MdnYariCompatibilityData;
}

export interface MdnYariDocBodyOther {
  type: 'interactive_example' | 'attributes' |
    'examples' | 'specifications' | 'info_box' |
    'class_constructor' | 'static_methods' |
    'instance_methods' | 'link_lists';
  value?:  Record<string, unknown>;
}

export type MdnYariDocBody =
  MdnYariDocBodyProse | MdnYariDocBodyCompatibility | MdnYariDocBodyOther;

export interface MdnYariDoc {
  title: string;
  pageTitle: string;
  mdn_url: string;
  sidebarHTML: string;
  toc: MdnYariToc[];
  body: MdnYariDocBody[];
  modified: string;
  flaws: MdnYariFlaws;
  other_translations?: MdnYariTranslation[];
  translation_of?: string;
  parents?: MdnYariDocParent[];
  source: MdnYariSource;
  contributors: string[];
  isArchive: boolean;
  isTranslated: boolean;
  locale?: string;
  popularity?: number;
  summary?: string;
}

/**
 * Custom interface to make sure dataURL and id is not empty
 */

export interface MdnYariCompatibilityDataWithUrl extends MdnYariCompatibilityData {
  dataURL: string
}

export type ProcessYariDataResult = MdnYariCompatibilityDataWithUrl[] | void;

/// endregion type def


export function preProcessYariDocData(
  data: MdnYariDoc
): MdnYariCompatibilityDataWithUrl[] | void {

  if (data.sidebarHTML) {
    data.sidebarHTML = '';
  }

  // flaws should be made empty
  if (data.flaws) {
    data.flaws = {};
  }

  // other_translations is not needed
  if (data.other_translations?.length) {
    data.other_translations = [];
  }

  const browserCompatibilityData: MdnYariCompatibilityData[] = [];
  if (data.body?.length) {
    for (let i = 0, item: MdnYariDocBody; i < data.body.length; i++) {
      item = data.body[i];
      if (item?.type === 'prose' && item.value) {
        const value = item.value;
        if (value && value.content) {
          value.content = '';
        }
      } else if (item?.type === 'browser_compatibility' && item.value) {
        const value = item.value;
        if (value) {
          browserCompatibilityData.push(value);
        }
      }
    }
  }

  let resultVal: ProcessYariDataResult;
  if (browserCompatibilityData.length > 0) {
    resultVal = [];
    for (let i = 0; i < browserCompatibilityData.length; i++) {
      const value = browserCompatibilityData[i];
      if (value && value.dataURL) {
        resultVal.push(value as MdnYariCompatibilityDataWithUrl);
      } else {
        errorLogger.info('incomplete browser_compatibility data',
          value, data.mdn_url);
      }
    }
  }
  return resultVal;
}

/**
 * Process yari hydration script to reduce its size
 * and extract browser_compatibility info
 * Note: a page can have multiple browser_compatibility section
 * https://github.com/mdn/yari/commit/107cf0ec5555405fe723d3b914ffd8246cac004c
 * @param text elem.text()
 * @param elem the script element
 * @return the browser_compatibility data
 */
export const preProcessYariHydrationData = (
  text: string, elem: Cheerio
): ProcessYariDataResult => {

  let data: { doc?: MdnYariDoc } | void;
  try {
    data = JSON.parse(text);
  } catch (e) {
    errorLogger.warn('postProcessYariData: json parse fail', e);
  }

  if (!data || !data.doc) {
    return;
  }
  const resultVal = preProcessYariDocData(data.doc);

  text = JSON.stringify(data)
    // escape html for js
    .replace(/</g, '\\x3c')
    .replace(/>/g, '\\x3e');
  elem.html(text);

  return resultVal;
};

const JSON_PARSE_STR = 'JSON.parse(';

/**
 * Process yari window.__data__ to reduce its size
 * and extract browser_compatibility info
 * Note: a page can have multiple browser_compatibility section
 * @param text elem.text()
 * @param elem the script element
 * @return the browser_compatibility data
 */
export const preProcessYariData = (
  text: string, elem: Cheerio
): ProcessYariDataResult => {
  let jsonStrBeginIndex: number = text.indexOf(JSON_PARSE_STR),
    jsonStrEndIndex: number,
    escapedJsonText: string,
    jsonText: string,
    data: MdnYariDoc | void;
  if (jsonStrBeginIndex < 1 ||
    jsonStrBeginIndex + JSON_PARSE_STR.length > text.length) {
    return;
  }
  jsonStrBeginIndex += JSON_PARSE_STR.length;
  if (!((jsonStrEndIndex = text.lastIndexOf('")')) > 0 &&
    ++jsonStrEndIndex < text.length &&
    (escapedJsonText = text.slice(jsonStrBeginIndex, jsonStrEndIndex)))) {
    return;
  }
  try {
    // unescape string for json
    jsonText = JSON.parse(escapedJsonText);
    data = JSON.parse(jsonText);
  } catch (e) {
    errorLogger.warn('postProcessYariData: json parse fail', e);
  }

  if (!data) {
    return;
  }
  const resultVal = preProcessYariDocData(data);

  // language=JavaScript
  text = `window.__data__ = ${JSON.stringify(data)
    // escape html for js
    .replace(/</g, '\\x3c')
    .replace(/>/g, '\\x3e')};`;
  elem.html(text);

  return resultVal;
};

const BCD_PLACE_HOLDER = 'BCD tables only load in the browser';

export interface MdnYariCompatibilityRenderingContext {
  res: Resource;
  data: MdnYariCompatibilityDataWithUrl;
  index: number;
}

export async function downloadAndRenderYariCompatibilityData(
  res: DownloadResource,
  submit: SubmitResourceFunc,
  pipeline: PipelineExecutor,
  $: CheerioStatic,
  dataScript: Cheerio | null,
  result: ProcessYariDataResult,
  locale: string
): Promise<void> {
  if (!result || !result.length) {
    return;
  }
  const contexts: MdnYariCompatibilityRenderingContext[] = [];

  for (let i = 0, data: MdnYariCompatibilityDataWithUrl, resource: Resource | void;
    i < result.length; i++) {
    data = result[i];
    resource = await pipeline.createAndProcessResource(
      data.dataURL,
      ResourceType.Binary,
      res.depth + 1,
      dataScript,
      res
    );

    if (!resource) continue;
    if (!resource.shouldBeDiscardedFromDownload) {
      contexts.push({res: resource, data, index: i});
    }
  }

  if (!contexts.length) {
    return;
  }

  const downloadResources =
    await Promise.all(contexts.map(c => pipeline.download(c.res)));
  const placeholders: Cheerio[] = [];
  const elements = $('#content>.article>p,#content>.main-page-content>p');
  for (let i = 0; i < elements.length; i++) {
    const el = $(elements[i]);
    const text = el.text();
    if (text && text.trim() === BCD_PLACE_HOLDER) {
      placeholders.push(el);
    }
  }

  if (!placeholders.length) {
    errorLogger.warn(
      'yari bcd: can not find a place to render the table', res.url);
  }

  for (let i = 0, r: DownloadResource | void, el: Cheerio,
    data: MdnYariCompatibilityDataWithUrl; i < downloadResources.length; i++) {
    r = downloadResources[i];
    data = contexts[i]?.data;
    el = placeholders[contexts[i].index];
    if (!(r && r.body && data)) {
      continue;
    }
    submit(r);
    if (!el) {
      errorLogger.warn(
        'yari bcd: can not find a place to render the table',
        data, contexts[i].index, res.url);
      continue;
    }
    if (data.id &&
      // case insensitive string comparison for id
      // https://github.com/mdn/yari/pull/2266
      el.prev().attr('id')?.toLowerCase() !== data.id.toLowerCase()) {
      errorLogger.warn(
        'yari bcd: rendering the table into wrong place',
        data, contexts[i].index, el.prev().attr('id'), res.url);
    }
    // note: keep the original body of resource
    const jsonData: YariCompatibilityDataJson =
      JSON.parse(toString(r.body, r.encoding));
    //
    if (!jsonData.locale) {
      jsonData.locale = locale;
    }
    const html = renderYariCompatibilityTable(jsonData);
    el.html(html);
  }
}
