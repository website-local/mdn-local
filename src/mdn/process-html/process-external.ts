import {
  complete as log,
  skipExternal
} from 'website-scrap-engine/lib/logger/logger.js';
import type {Cheerio, CheerioStatic} from 'website-scrap-engine/lib/types.js';
import {localeArr} from '../process-url/consts.js';

const relativeStandalonePlaygroundHref =
  /^(?:\.\.\/)*play\.html(?<suffix>[?#].*)?$/;
const mdnStandalonePlaygroundHref =
  /^(?:https?:\/\/developer\.mozilla\.org)?\/(?<locale>[^/?#]+)\/play(?:\.html)?\/?(?<suffix>[?#].*)?$/;
const mdnLocales = new Set(['en-US', ...localeArr]);
const observatoryDocsUrl =
  'https://developer.mozilla.org/en-US/observatory/docs/tests_and_scoring';

const getLocaleFromUrl = (url: string): string => {
  const match = url.match(/^https?:\/\/developer\.mozilla\.org\/([^/?#]+)/);
  return match?.[1] || 'en-US';
};

const getExternalStandalonePlaygroundHref = (
  href: string,
  locale: string
): string | void => {
  const relativeMatch = href.match(relativeStandalonePlaygroundHref);
  if (relativeMatch) {
    return `https://developer.mozilla.org/${locale}/play` +
      (relativeMatch.groups?.suffix || '');
  }
  const mdnMatch = href.match(mdnStandalonePlaygroundHref);
  if (mdnMatch && mdnLocales.has(mdnMatch.groups?.locale || '')) {
    return `https://developer.mozilla.org/${mdnMatch.groups?.locale}/play` +
      (mdnMatch.groups?.suffix || '');
  }
};

export const postProcessAddIconToExternalLinks = ($: CheerioStatic): void => {
  // no need to add class external-icon for yari
  $('#content > .article a[href^="http://"]').addClass('external');
  $('#content > .article a[href^="https://"]').addClass('external');
};

export const postProcessExternalizeStandalonePlaygroundLinks = (
  $: CheerioStatic,
  resUrl: string
): void => {
  const locale = getLocaleFromUrl(resUrl);
  const links = $('a[href]');
  for (let i = 0; i < links.length; i++) {
    const link = $(links[i]);
    const href = link.attr('href');
    if (!href) {
      continue;
    }
    const externalHref = getExternalStandalonePlaygroundHref(href, locale);
    if (!externalHref) {
      continue;
    }
    link
      .attr('href', externalHref)
      .attr('target', '_blank')
      .attr('rel', 'noopener noreferrer')
      .addClass('external');
  }
};

const replaceElementWithExternalParagraph = (
  $: CheerioStatic,
  selector: string,
  url: string,
  text: string
): void => {
  const elements = $(selector);
  for (let i = 0; i < elements.length; i++) {
    const link = $('<a class="external"></a>')
      .attr('href', url)
      .attr('target', '_blank')
      .attr('rel', 'noopener noreferrer')
      .text(text);
    const paragraph = $('<p></p>').append(link);
    $(elements[i]).replaceWith(paragraph);
  }
};

export const postProcessReplaceOnlineOnlyMdnWidgets = (
  $: CheerioStatic,
  resUrl: string
): void => {
  const locale = getLocaleFromUrl(resUrl);
  const liveLocale = mdnLocales.has(locale) ? locale : 'en-US';
  const observatoryUrl =
    `https://developer.mozilla.org/${liveLocale}/observatory`;

  replaceElementWithExternalParagraph(
    $,
    'mdn-observatory-form',
    observatoryUrl,
    'Open the live MDN Observatory'
  );
  replaceElementWithExternalParagraph(
    $,
    'mdn-observatory-results',
    observatoryUrl,
    'Open the live MDN Observatory results'
  );
  replaceElementWithExternalParagraph(
    $,
    'mdn-observatory-tests-and-scores',
    observatoryDocsUrl,
    'Open the live MDN Observatory tests and scoring data'
  );
};

export const replaceExternalItemWithLink = (
  $: CheerioStatic,
  elem: Cheerio,
  url: string,
  type: string
): void => {
  // language=HTML
  const a = $('<a class="external external-icon mdn-local-external-' +
    type +
    '-link"></a>');
  a.attr('href', url)
    .attr('target', '_blank')
    .attr('rel', 'noopener noreferrer');
  // workaround for outer html
  // https://github.com/cheeriojs/cheerio/issues/944
  a.text(elem.clone().wrap('<container />').parent().html() as string);
  elem.replaceWith(a);
  log.debug('replace external', type, url);
};

export const postProcessReplaceExternalIframeWithLink = (
  $: CheerioStatic, resUrl: string
): void => {
  let i = 0,
    item: Cheerio,
    src: string | void;
  const result = $('iframe'),
    len = result.length;
  for (; i < len; i++) {
    item = $(result[i]);
    src = item.attr('src');
    if (src && (src.startsWith('https://') || src.startsWith('http://'))) {
      skipExternal.warn('skipped external iframe', src, resUrl);
      replaceExternalItemWithLink($, item, src, 'iframe');
    }
  }
};

export const postProcessReplaceExternalScriptWithLink = (
  $: CheerioStatic, resUrl: string
): void => {
  let i = 0,
    item: Cheerio,
    src: string | void;
  const result = $('script'),
    len = result.length;
  for (; i < len; i++) {
    item = $(result[i]);
    src = item.attr('src');
    if (src && (src.startsWith('https://') || src.startsWith('http://'))) {
      skipExternal.warn('skipped external script', src, resUrl);
      replaceExternalItemWithLink($, item, src, 'script');
    }
  }
};

export const postProcessReplaceExternalImgWithLink = (
  $: CheerioStatic, resUrl: string
): void => {
  let i = 0,
    item: Cheerio,
    src: string | void;
  const result = $('img'),
    len = result.length;
  for (; i < len; i++) {
    item = $(result[i]);
    src = item.attr('src');
    // TODO: srcset
    if (src && (src.startsWith('https://') || src.startsWith('http://'))) {
      skipExternal.warn('skipped external img', src, resUrl);
      replaceExternalItemWithLink($, item, src, 'img');
    }
  }
};

export const postProcessReplaceExternalMediaWithLink = (
  $: CheerioStatic, resUrl: string
): void => {
  let i = 0,
    item: Cheerio,
    sources: Cheerio,
    source: Cheerio,
    j: number,
    src: string | void,
    foundExternalLink: boolean;
  // TODO: picture and srcset
  const result = $('audio,video'),
    len = result.length;
  for (; i < len; i++) {
    item = $(result[i]);
    foundExternalLink = false;
    src = item.attr('src');
    if (src && (src.startsWith('https://') || src.startsWith('http://'))) {
      foundExternalLink = true;
    }
    if (!foundExternalLink) {
      sources = item.children();
      for (j = 0; j < sources.length; j++) {
        source = $(sources[j]);
        src = source.attr('src');
        if (src && (src.startsWith('https://') || src.startsWith('http://'))) {
          foundExternalLink = true;
          break;
        }
      }
    }
    if (foundExternalLink) {
      skipExternal.warn('skipped external media', src, resUrl);
      // src must be non-void if foundExternalLink
      replaceExternalItemWithLink($, item, src as string, 'media');
    }
  }
};
