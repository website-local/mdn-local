import type {Cheerio, CheerioStatic} from 'website-scrap-engine/lib/types.js';

export const preProcessRemoveCompatibilityTableWarning = ($: CheerioStatic): void => {
  let i = 0,
    item: Cheerio,
    html: string | null;
  // #content >.article .warning.notecard in introduced in yari
  const result = $('.blockIndicator.warning,#content >.article .warning.notecard'),
    len = result.length;
  for (; i < len; i++) {
    item = $(result[i]);
    html = item.html();
    if (html && html.includes('https://github.com/mdn/browser-compat-data')) {
      item.remove();
    }
  }
};
