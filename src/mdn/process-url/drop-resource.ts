import {downloadableHosts, localeArr, mdnHosts} from './consts.js';
import type {Resource} from 'website-scrap-engine/lib/resource.js';
import {ResourceType} from 'website-scrap-engine/lib/resource.js';
import {skipExternal} from 'website-scrap-engine/lib/logger/logger.js';
import type {StaticDownloadOptions} from 'website-scrap-engine/lib/options.js';
import URI from 'urijs';
import type {Cheerio} from 'website-scrap-engine/lib/types.js';
import {isMdnLoginUrl} from './login-url.js';

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
  const path = res.uri.path(),
    host = res.uri.host();
  // WHATWG is allowed for static assets. Its HTML pages must stay online;
  // crawling legacy specification links also pulls their entire asset graph.
  if (res.type === ResourceType.Html) {
    const external = res.uri.clone();
    const mdnHost = options.meta.host || 'developer.mozilla.org';
    if (host === mdnHost &&
      (path === '/www.whatwg.org' || path.startsWith('/www.whatwg.org/'))) {
      external.host('www.whatwg.org')
        .path(path.slice('/www.whatwg.org'.length) || '/');
    }
    if (external.host() === 'www.whatwg.org') {
      res.replacePath = external.toString();
      res.replaceUri = external;
      res.shouldBeDiscardedFromDownload = true;
      skipExternal.info('skipped WHATWG HTML', res.replacePath, res.refUrl);
      return res;
    }
  }
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
  const isOnlineOnlyObservatoryAnalyze =
    path === `/${locale}/observatory/analyze` ||
    path === `/${locale}/observatory/analyze/` ||
    path === `/${locale}/observatory/analyze.html`;
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
    isMdnLoginUrl(res.url) ||
    // The standalone Playground app depends on Fred frontend modules and
    // online API/login behavior. Embedded examples are handled separately.
    isStandalonePlayground ||
    // Queryless Observatory analyze pages are app shells that render results
    // only after Fred hydration and live API calls.
    isOnlineOnlyObservatoryAnalyze ||
    // Legacy mdn.dev site paths should be rewritten to developer.mozilla.org.
    // If a fake local /mdn.dev/en* path still slips through, drop it
    // instead of letting it recursively mirror the mdn.dev site shell.
    isFakeMdnDevLegacySitePath ||
    // Old archived sample stylesheets now point at search or docs routes.
    // Keep the samples, but drop these dead legacy CSS paths.
    isDeadLegacySampleStylesheet ||
    // file name conflicts
    path.includes('release_notes.html/NSS_3.12.3_release_notes.html') ||
    /^\/(?:[a-z]{2}(?:-[A-Za-z]+)?\/)?profiles(?:\/|$)/.test(path)) {
    res.shouldBeDiscardedFromDownload = true;
  }
  return res;
}
