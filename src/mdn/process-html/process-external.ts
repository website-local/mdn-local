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
      a = $('<a class="external external-icon mdn-local-external-iframe-link"></a>');
      a.attr('href', src)
        .attr('target', '_blank')
        .attr('rel', 'noopener noreferrer');
      // workaround for outer html
      // https://github.com/cheeriojs/cheerio/issues/944
      a.text(item.clone().wrap('<container />').parent().html() as string);
      item.replaceWith(a);
    }
  }
};
