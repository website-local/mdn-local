import {error as errorLogger} from 'website-scrap-engine/lib/logger/logger';

export interface MdnReactData {
  locale?: string;
  pluralExpression?: string | number;
  url?: string;
  stringCatalog?: {
    [k: string]: string | string[]
  };
  documentData?: {
    absoluteURL?: string;
    bodyHTML?: string;
    enSlug?: string;
    hrefLang?: string;
    id?: number | string;
    language?: string;
    lastModified?: string;
    locale?: string;
    parents?: {
      url: string;
      title: string;
    }[];
    quickLinksHTML?: string;
    raw?: string;
    slug?: string;
    summary?: string;
    title?: string;
    tocHTML?: string;
    translateURL?: null | unknown;
    translationStatus?: null | unknown;
    translations: {
      hrefLang?: string;
      language?: string;
      locale?: string;
      localizedLanguage?: string;
      title?: string;
      url?: string;
    }[];
    wikiURL?: string;
  }
}

const JSON_PARSE_STR = 'JSON.parse(';
// place holders
const PLACE_HOLDER_BODY_HTML = '@#%PLACE_HOLDER_BODY_HTML%#@';
const PLACE_HOLDER_QUICK_HTML = '@#!PLACE_HOLDER_QUICK_HTML!#@';
const PLACE_HOLDER_TOC_HTML = '@#!%PLACE_HOLDER_TOC_HTML!#%@';
const PLACE_HOLDER_SUMMARY_HTML = '@#!%$PLACE_HOLDER_SUMMARY_HTML!$#%@';

export const postProcessReactData = (text: string, elem: Cheerio): void => {
  let jsonStrBeginIndex: number = text.indexOf(JSON_PARSE_STR),
    jsonStrEndIndex: number,
    escapedJsonText: string,
    jsonText: string,
    data: MdnReactData | void,
    stringCatalog: MdnReactData['stringCatalog'],
    key: string;
  if (jsonStrBeginIndex < 1 ||
    jsonStrBeginIndex + JSON_PARSE_STR.length > text.length) {
    return;
  }
  jsonStrBeginIndex += JSON_PARSE_STR.length;
  if (!((jsonStrEndIndex = text.lastIndexOf('"')) > 0 &&
    ++jsonStrEndIndex < text.length &&
    (escapedJsonText = text.slice(jsonStrBeginIndex, jsonStrEndIndex)))) {
    return;
  }
  try {
    jsonText = JSON.parse(escapedJsonText);
    data = /** @type MdnReactData */ JSON.parse(jsonText);
  } catch (e) {
    errorLogger.warn('postProcessReactData: json parse fail', e);
  }
  if (!data) {
    return;
  }
  if (data.documentData) {
    data.documentData.translations = [];
    if (data.documentData.bodyHTML) {
      data.documentData.bodyHTML = PLACE_HOLDER_BODY_HTML;
    }
    if (data.documentData.quickLinksHTML) {
      data.documentData.quickLinksHTML = PLACE_HOLDER_QUICK_HTML;
    }
    if (data.documentData.tocHTML) {
      data.documentData.tocHTML = PLACE_HOLDER_TOC_HTML;
    }
    if (data.documentData.summary) {
      data.documentData.summary = PLACE_HOLDER_SUMMARY_HTML;
    }
    if (data.documentData.raw) {
      // not needed in pages
      data.documentData.raw = '';
    }
    // remove the generated translate sign
    if (data.documentData.translateURL) {
      data.documentData.translateURL = '';
    }
    if (data.locale && data.documentData.locale) {
      data.documentData.locale = data.locale;
    }
  }
  if ((stringCatalog = data.stringCatalog)) {
    for (key in stringCatalog) {
      // noinspection JSUnfilteredForInLoop
      if (key.includes('<') ||
        // Invalid or unexpected token
        key.includes('>') ||
        // useless items for local version
        key.startsWith('Our goal is to provide accurate') ||
        key.startsWith('Publishing failed.') ||
        key.startsWith('Would you answer 4 questions for us') ||
        key.startsWith('I’m okay with Mozilla') ||
        key.startsWith('A newer version of this article') ||
        key.startsWith('If you haven’t previously confirmed a subscription to a Mozilla') ||
        key.startsWith('Because we aren’t looking for a lump sum.') ||
        key.startsWith('An error occurred trying to set up the subscription with Stripe') ||
        key.startsWith('Currently, Mozilla pays for site operations and overhead') ||
        key.startsWith('MDN is funded out of the Mozilla Corporation') ||
        key.startsWith('Mozilla will collect and store your name and email') ||
        key.startsWith('No. Payments to Mozilla Corporation in support of MDN') ||
        key.startsWith('Our user base has grown exponentially in the last few years') ||
        key.startsWith('Sign in to support MDN') ||
        key.startsWith('Support MDN with a %(amount)s') ||
        key.startsWith('The Mozilla Corporation, which funds MDN') ||
        key.startsWith('The money collected through MDN') ||
        key.startsWith('When you request to delete your account') ||
        key.startsWith('Our team will review your report.')) {
        // noinspection JSUnfilteredForInLoop
        delete stringCatalog[key];
      }
    }
  }
  // language=JavaScript
  text = `
!function() {
  'use strict';
  var _mdn_local_quickLinks = document.querySelector('.quick-links ol'),
  _mdn_local_body = document.getElementById('wikiArticle'),
  _mdn_local_toc = document.querySelector('.document-toc ul'),
  _mdn_local_summary = document.querySelector('#wikiArticle>p');
  // replace _react_data to reduce size
  window._react_data = ${JSON.stringify(data)
    .replace(`"${PLACE_HOLDER_QUICK_HTML}"`,
      '_mdn_local_quickLinks && _mdn_local_quickLinks.outerHTML')
    .replace(`"${PLACE_HOLDER_BODY_HTML}"`,
      '_mdn_local_body && _mdn_local_body.innerHTML')
    .replace(`"${PLACE_HOLDER_SUMMARY_HTML}"`,
      '_mdn_local_summary && _mdn_local_summary.innerHTML')
    .replace(`"${PLACE_HOLDER_TOC_HTML}"`,
      '_mdn_local_toc && _mdn_local_toc.innerHTML')
    // escape html for js
    .replace(/</g, '\\x3c')
    .replace(/>/g, '\\x3e')};
}();
  `.trim();
  elem.html(text);
};
