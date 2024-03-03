import {downloadableHosts, localeArr, mdnHosts} from './consts';
import type {Resource} from 'website-scrap-engine/lib/resource';
import type {StaticDownloadOptions} from 'website-scrap-engine/lib/options';
import URI from 'urijs';
import type {Cheerio} from 'website-scrap-engine/lib/types';

const regExpCache: Record<string, RegExp> = {};

const testLocaleRegExp = (locale: string): RegExp => {
  if (regExpCache[locale]) {
    return regExpCache[locale];
  }
  return regExpCache[locale] = new RegExp(
    `/(${localeArr.filter(l => l !== locale).join('|')})\\//`, 'i');
};

export function dropResource(
  res: Resource,
  element: Cheerio | null,
  parent: Resource | null,
  options: StaticDownloadOptions
): Resource | void {
  const locale = options.meta.locale as string;
  if (!res.uri) {
    res.uri = URI(res.url);
  }
  const dir = res.uri.directory(),
    path = res.uri.path(),
    host = res.uri.host();
  if (host === 'mdn.mozillademos.org' && path.startsWith('/files')) {
    return res;
  }
  // https://github.com/website-local/mdn-local/issues/372
  if (mdnHosts[host] && path === `/${locale}/search-index.json`) {
    return res;
  }
  if (!downloadableHosts[host] ||
    testLocaleRegExp(locale).test(path) ||
    path === '/events' ||
    path.startsWith('/search') ||
    path.startsWith('/presentations/') ||
    path.startsWith('/devnews/') ||
    path.startsWith(`/${locale}/search`) ||
    path.startsWith(locale + '/search') ||
    path.startsWith('search') ||
    // fake url
    path.startsWith('/static/css/inject.css') ||
    path.startsWith('/static/js/inject.js') ||
    path.endsWith('$history') ||
    path.endsWith('$children') ||
    path.endsWith('$json') ||
    path.endsWith('$edit') ||
    path.endsWith('$toc') ||
    // /docs/Archive/Mozilla/Bookmark_keywords
    path.endsWith('/docs/Special:Search') ||
    path.endsWith('$translate') ||
    path.endsWith('%24history') ||
    path.endsWith('%24edit') ||
    path.endsWith('%24translate') ||
    path.includes('/users/github/login') ||
    path.includes('/users/google/login') ||
    path.includes('/users/signin') ||
    // file name conflicts
    path.includes('release_notes.html/NSS_3.12.3_release_notes.html') ||
    (path.includes('/profiles/') && path.endsWith('/edit')) ||
    dir.endsWith('/profiles')) {
    res.shouldBeDiscardedFromDownload = true;
  }
  return res;
}
