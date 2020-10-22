import {error as errorLogger} from 'website-scrap-engine/lib/logger/logger';
import {Cheerio} from 'website-scrap-engine/lib/types';

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

const uselessStringCatalogsForLocalUsage = [
  'A newer version of this article',
  'All payment information goes through',
  'An error happened trying to',
  'Because we aren’t looking for a lump sum.',
  'Browser documentation and release notes',
  'By clicking this button, I authorize',
  'Compare this date to the latest',
  'Currently, Mozilla pays for site operations',
  'Deleting your account loses any preferences',
  'Get 20% off at the',
  'Get discounts on sweet',
  'If you have questions, please',
  'If you haven’t previously confirmed',
  'If you would like to',
  'I’m okay with Mozilla',
  'MDN is funded out of the Mozilla',
  'MDN is seeking direct support',
  'Mozilla will collect and store your',
  'No. Payments to Mozilla Corporation',
  'Our goal is to provide accurate',
  'Our team will review your report.',
  'Our user base has grown exponentially in the last few years',
  'Publishing failed.',
  'Separately, the Mozilla',
  'Sign in to support MDN',
  'Sorry, we can’t seem to reach',
  'Support MDN with a %(amount)s',
  'The Mozilla Corporation, which funds MDN',
  'The money collected through MDN',
  'To find out more about',
  'When you request to delete your account',
  'Would you answer 4 questions for us',
  'You can cancel your monthly',
  'You can join the GitHub',
  '👋 Do you use Chrome’s automatic'
];

let fastUselessStringCatalogsForLocalUsage: Record<string, string[]> | void;

const shouldDropStringCatalog = (key: string): boolean => {
  // lazy init
  if (!fastUselessStringCatalogsForLocalUsage) {
    fastUselessStringCatalogsForLocalUsage = {};
    for (const string of uselessStringCatalogsForLocalUsage) {
      if (!fastUselessStringCatalogsForLocalUsage[string[0]]) {
        fastUselessStringCatalogsForLocalUsage[string[0]] = [string];
        continue;
      }
      fastUselessStringCatalogsForLocalUsage[string[0]].push(string);
    }
  }
  let uselessStringCatalogs: string[];
  if (!(uselessStringCatalogs = fastUselessStringCatalogsForLocalUsage[key[0]])) {
    return false;
  }
  for (const uselessStringCatalog of uselessStringCatalogs) {
    if (key.startsWith(uselessStringCatalog)) {
      return true;
    }
  }
  return false;
};

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
        shouldDropStringCatalog(key)) {
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
