import {complete as log} from 'website-scrap-engine/lib/logger/logger';

export const preProcessAddIconToExternalLinks = ($: CheerioStatic): void => {
  if ($('script[src*="build/js/wiki"]').length) {
    return;
  }
  // original script form developer.mozilla.org/static/build/js/wiki.62ddb187a9d0.js
  $('.external').each(function (this: CheerioElement) {
    const $link = $(this);
    if (!$link.find('img').length) {
      $link.addClass('external-icon');
    }
  });
};

export const postProcessReplaceExternalIframeWithLink = ($: CheerioStatic): void => {
  let i = 0,
    item: Cheerio,
    src: string | void,
    a: Cheerio;
  const result = $('iframe'),
    len = result.length;
  for (; i < len; i++) {
    item = $(result[i]);
    src = item.attr('src');
    if (src && (src.startsWith('https://') || src.startsWith('http://'))) {
      // language=HTML
      a = $('<a class="external external-icon mdn-local-external-iframe-link"></a>');
      a.attr('href', src)
        .attr('target', '_blank')
        .attr('rel', 'noopener noreferrer');
      // workaround for outer html
      // https://github.com/cheeriojs/cheerio/issues/944
      a.text(item.clone().wrap('<container />').parent().html() as string);
      item.replaceWith(a);
      log.debug('replace external iframe', src);
    }
  }
};

export const postProcessReplaceExternalImgWithLink = ($: CheerioStatic): void => {
  let i = 0,
    item: Cheerio,
    src: string | void,
    a: Cheerio;
  const result = $('img'),
    len = result.length;
  for (; i < len; i++) {
    item = $(result[i]);
    src = item.attr('src');
    // TODO: srcset
    if (src && (src.startsWith('https://') || src.startsWith('http://'))) {
      // language=HTML
      a = $('<a class="external external-icon mdn-local-external-img-link"></a>');
      a.attr('href', src)
        .attr('target', '_blank')
        .attr('rel', 'noopener noreferrer');
      // workaround for outer html
      // https://github.com/cheeriojs/cheerio/issues/944
      a.text(item.clone().wrap('<container />').parent().html() as string);
      item.replaceWith(a);
      log.debug('replace external img', src);
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
    a: Cheerio,
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
      // language=HTML
      a = $('<a class="external external-icon mdn-local-external-media-link"></a>');
      // src must be non-void if foundExternalLink
      a.attr('href', src as string)
        .attr('target', '_blank')
        .attr('rel', 'noopener noreferrer');
      // workaround for outer html
      // https://github.com/cheeriojs/cheerio/issues/944
      a.text(item.clone().wrap('<container />').parent().html() as string);
      item.replaceWith(a);
      log.debug('replace external media', src);
    }
  }
};

