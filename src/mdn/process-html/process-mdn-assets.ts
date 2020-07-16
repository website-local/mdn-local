import JSON5 from 'json5';
import {error as errorLogger} from 'website-scrap-engine/lib/logger/logger';

export interface MdnAssets {
  css?: {
    [k: string]: string[];
  };
  js?: {
    [k: string]: string[];
  };
}

export interface MdnAssetsData {
  assetsData: MdnAssets
  assetsBeginIndex: number | void
  assetsEndIndex: number | void
}

export const extractMdnAssets = (text: string): MdnAssetsData | void => {

  let assetsBaseIndex: number,
    assetsBeginIndex: number | void,
    assetsEndIndex: number | void,
    assetsData: MdnAssets | void;

  if ((assetsBaseIndex = text.indexOf('mdn.assets')) > 0 &&
    (assetsBeginIndex = text.indexOf('=', assetsBaseIndex)) > 0 &&
    (assetsEndIndex = text.indexOf(';', assetsBeginIndex)) > 0) {
    try {
      assetsData = JSON5.parse(text.slice(++assetsBeginIndex, assetsEndIndex));
    } catch (e) {
      errorLogger.warn('extractMdnAssets fail', e);
    }
  }
  if (!assetsData) {
    return;
  }
  return {
    assetsData,
    assetsBeginIndex,
    assetsEndIndex
  };
};

const TO_REMOVE_CLASS = 'to-remove-elem';

export const preProcessMdnAssets = (
  $: CheerioStatic,
  text: string,
  assets: MdnAssets
): void => {
  let keys: string[],
    len: number,
    i: number,
    key: string,
    values: string[],
    valueLen: number,
    j: number;
  const head = $('head');
  if (assets.js &&
    (keys = Object.keys(assets.js)) &&
    (len = keys.length)) {
    for (i = 0; i < len; i++) {
      if ((key = keys[i]) &&
        (values = assets.js[key]) &&
        (valueLen = values.length)) {
        for (j = 0; j < valueLen; j++) {
          $(`<script class="${TO_REMOVE_CLASS}" src="${
            values[j]
          }" defer data-key="${key}"></script>`)
            .appendTo(head);
        }
      }
    }
  }
  if (assets.css &&
    (keys = Object.keys(assets.css)) &&
    (len = keys.length)) {
    for (i = 0; i < len; i++) {
      if ((key = keys[i]) &&
        (values = assets.css[key]) &&
        (valueLen = values.length)) {
        for (j = 0; j < valueLen; j++) {
          $(`<link class="${TO_REMOVE_CLASS}" rel="stylesheet" href="${
            values[j]
          }" data-key="${key}"/>`)
            .appendTo(head);
        }
      }
    }
  }
};

export const postProcessMdnAssets = (
  text: string,
  $: CheerioStatic,
  elem: Cheerio
): string | void => {
  let assetsData: ReturnType<typeof extractMdnAssets>;
  if (!((assetsData = extractMdnAssets(text)) &&
    assetsData.assetsEndIndex !== undefined &&
    assetsData.assetsBeginIndex !== undefined &&
    assetsData.assetsBeginIndex > 0 &&
    assetsData.assetsEndIndex > assetsData.assetsBeginIndex)) {
    return;
  }
  const assetsBody: MdnAssets = {
    js: {},
    css: {}
  };
  $('.' + TO_REMOVE_CLASS).each((index, el) => {
    let base, key, url;
    const elem = $(el);
    if (elem.is('script')) {
      base = assetsBody.js;
      url = elem.attr('src');
    } else if (elem.is('link')) {
      base = assetsBody.css;
      url = elem.attr('href');
    } else {
      return;
    }
    if (!(key = elem.attr('data-key'))) {
      return;
    }
    if (!base) {
      base = {};
    }
    if (!base[key]) {
      base[key] = [];
    }
    if (url) {
      base[key].push(url);
    }
    elem.remove();
  });
  text = text.slice(0, assetsData.assetsBeginIndex) +
    JSON.stringify(assetsBody) +
    text.slice(assetsData.assetsEndIndex);
  elem.html(text);
  return text;
};
