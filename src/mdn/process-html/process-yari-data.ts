import {error as errorLogger} from 'website-scrap-engine/lib/logger/logger';
import {Cheerio} from 'website-scrap-engine/lib/types';

/// region type def
// See https://github.com/mdn/yari/blob/
// 8eb1172fc348e8a36969a86bf2c7484e93f288f2/client/src/document/types.tsx
// https://github.com/mdn/yari/blob/
// 596bc1906fd86b55055bb46ff6ceabe3a5567cf4/client/src/document/index.tsx
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
  isH3?: false
  query?: string
  title?: string
}

/**
 * Custom interface to make sure dataURL and id is not empty
 */
export interface MdnYariCompatibilityDataInfo extends MdnYariCompatibilityData {
  dataURL: string
  id: string
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
/// endregion type def

const JSON_PARSE_STR = 'JSON.parse(';

/**
 * Process yari window.__data__ to reduce its size
 * and extract browser_compatibility info
 * Note: a page can have multiple browser_compatibility section
 * @param text elem.text()
 * @param elem the script element
 * @return the browser_compatibility data
 */
export const postProcessYariData = (
  text: string, elem: Cheerio
): MdnYariCompatibilityDataInfo[] | void => {
  let jsonStrBeginIndex: number = text.indexOf(JSON_PARSE_STR),
    jsonStrEndIndex: number,
    escapedJsonText: string,
    jsonText: string,
    data: MdnYariDoc | void;
  const browserCompatibilityData: MdnYariCompatibilityDataInfo[] = [];
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
        if (value && value.dataURL && value.id) {
          browserCompatibilityData.push(value as MdnYariCompatibilityDataInfo);
        } else {
          errorLogger.info('incomplete browser_compatibility data',
            value, data.mdn_url);
        }
      }
    }
  }

  // language=JavaScript
  text = `window.__data__ = ${JSON.stringify(data)
    // escape html for js
    .replace(/</g, '\\x3c')
    .replace(/>/g, '\\x3e')};`;
  elem.html(text);

  return browserCompatibilityData.length ?
    browserCompatibilityData : undefined;
};
