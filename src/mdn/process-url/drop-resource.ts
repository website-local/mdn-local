import {downloadableHosts, localeArr, mdnHosts} from './consts.js';
import type {Resource} from 'website-scrap-engine/lib/resource.js';
import type {StaticDownloadOptions} from 'website-scrap-engine/lib/options.js';
import URI from 'urijs';
import type {Cheerio} from 'website-scrap-engine/lib/types.js';

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
  const isFakeMdnDevLegacySitePath =
    path === '/mdn.dev/en' ||
    path.startsWith('/mdn.dev/en/') ||
    path === '/mdn.dev/en-US' ||
    path.startsWith('/mdn.dev/en-US/');
  const isDeadLegacySampleStylesheet =
    path === '/css/base.css' ||
    path === '/css/wiki.css' ||
    path === '/mdn.dev/css/base.css' ||
    path === '/mdn.dev/css/wiki.css';
  const isStandalonePlayground =
    path === `/${locale}/play` ||
    path === `/${locale}/play/` ||
    path === `/${locale}/play.html`;
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
    // The standalone Playground app depends on Fred frontend modules and
    // online API/login behavior. Embedded examples are handled separately.
    isStandalonePlayground ||
    // Legacy mdn.dev site paths should be rewritten to developer.mozilla.org.
    // If a fake local /mdn.dev/en* path still slips through, drop it
    // instead of letting it recursively mirror the mdn.dev site shell.
    isFakeMdnDevLegacySitePath ||
    // Old archived sample stylesheets now point at search or docs routes.
    // Keep the samples, but drop these dead legacy CSS paths.
    isDeadLegacySampleStylesheet ||
    // file name conflicts
    path.includes('release_notes.html/NSS_3.12.3_release_notes.html') ||
    (path.includes('/profiles/') && path.endsWith('/edit')) ||
    dir.endsWith('/profiles')) {
    res.shouldBeDiscardedFromDownload = true;
  }
  return res;
}
