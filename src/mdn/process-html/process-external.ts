import {complete as log} from 'website-scrap-engine/lib/logger/logger';
import {Cheerio, CheerioStatic} from 'website-scrap-engine/lib/types';

export const preProcessAddIconToExternalLinks = ($: CheerioStatic): void => {
  if ($('script[src*="build/js/wiki"]').length) {
    return;
  }
  // original script form developer.mozilla.org/static/build/js/wiki.62ddb187a9d0.js
  $('.external').each(function (index, element) {
    const $link = $(element);
    if (!$link.find('img').length) {
      $link.addClass('external-icon');
    }
  });
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

export const postProcessReplaceExternalIframeWithLink = ($: CheerioStatic): void => {
  let i = 0,
    item: Cheerio,
    src: string | void;
  const result = $('iframe'),
    len = result.length;
  for (; i < len; i++) {
    item = $(result[i]);
    src = item.attr('src');
    if (src && (src.startsWith('https://') || src.startsWith('http://'))) {
      replaceExternalItemWithLink($, item, src, 'iframe');
    }
  }
};

export const postProcessReplaceExternalImgWithLink = ($: CheerioStatic): void => {
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
      replaceExternalItemWithLink($, item, src, 'img');
    }
  }
};

export const postProcessReplaceExternalMediaWithLink = ($: CheerioStatic): void => {
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
      // src must be non-void if foundExternalLink
      replaceExternalItemWithLink($, item, src as string, 'media');
    }
  }
};

