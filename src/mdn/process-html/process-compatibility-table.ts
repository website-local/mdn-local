import {Cheerio, CheerioStatic} from 'website-scrap-engine/lib/types';

export const preProcessRemoveCompatibilityTableWarning = ($: CheerioStatic): void => {
  let i = 0,
    item: Cheerio,
    html: string | null;
  const result = $('.blockIndicator.warning'),
    len = result.length;
  for (; i < len; i++) {
    item = $(result[i]);
    html = item.html();
    if (html && html.includes('https://github.com/mdn/browser-compat-data')) {
      item.remove();
    }
  }
};
