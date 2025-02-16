import type {Resource} from 'website-scrap-engine/lib/resource.js';
import type {StaticDownloadOptions} from 'website-scrap-engine/lib/options.js';
import {error as errorLogger} from 'website-scrap-engine/lib/logger/logger.js';
import type {Cheerio} from 'website-scrap-engine/lib/types.js';
import {
  appendDocsPath,
  appendDocsWebPath,
  appendLocalePath,
  downloadableHosts,
  externalHostMap,
  externalHosts,
  localesMap,
  redirectLocale
} from './consts';
import {
  hardCodedRedirectUrl,
  mdnLocaleRedirectPath,
  mdnRedirectPath
} from './redirect-path';
import URI from 'urijs';
import {processPathWithMultiLocale} from './process-path-with-multi-locale.js';

const cache: Record<string, Record<string, string>> = {};
const getMdnRedirectPath = (locale: string): Record<string, string> => {
  if (cache[locale]) {
    return cache[locale];
  }
  return cache[locale] =
    Object.assign(mdnRedirectPath(locale), mdnLocaleRedirectPath(locale));
};

export function fixUrlWithBadFormat(url: string): string {
  if (!url) return url;
  url = url.trim();
  if (url.startsWith('<=%=baseURL')) {
    url = url.slice('<=%=baseURL'.length);
  } else if (url.startsWith('%3Ccode%3E') && url.endsWith('%3C/code%3E')) {
    url = url.slice(10, url.length - 11);
  } else if (url.startsWith('<code>') && url.endsWith('</code>')) {
    url = url.slice(6, url.length - 7);
  } else if ((url.startsWith('<') || url.startsWith('&lt;')) &&
    (url.endsWith('>') || url.endsWith('&gt;'))) {
    if (url.startsWith('<')) {
      url = url.slice(1);
    }
    if (url.startsWith('&lt;')) {
      url = url.slice(4);
    }
    if (url.endsWith('>')) {
      url = url.slice(0, url.length - 1);
    }
    if (url.endsWith('&gt;')) {
      url = url.slice(0, url.length - 4);
    }
  }
  if ((url.startsWith('(http://') || url.startsWith('(https://')) &&
    url.endsWith(')')) {
    url = url.slice(1, -1);
  } else if ((url.startsWith('/(http://') || url.startsWith('/(https://')) &&
    url.endsWith(')')) {
    url = url.slice(2, -1);
  }
  if ((url.startsWith('%28http://') || url.startsWith('%28https://')) &&
    url.endsWith('%29')) {
    url = url.slice(3, -3);
  } else if ((url.startsWith('/%28http://') || url.startsWith('/%28https://')) &&
    url.endsWith('%29')) {
    url = url.slice(4, -3);
  }
  // https:\\google.com
  // from https://developer.mozilla.org/en-US/docs/Learn/Server-side/First_steps/Introduction
  if (url.startsWith('http:\\\\') || url.startsWith('https:\\\\')) {
    url = url.replace('\\\\', '//');
  }
  return url;
}

export function redirectUrl(
  url: string,
  element: Cheerio | null,
  parent: Resource | null,
  options: StaticDownloadOptions
): string | void {
  const locale = options.meta.locale as string;
  if (url) {
    url = fixUrlWithBadFormat(url);
  }
  if (!url) return url;
  let u = URI(url).normalize(), host, needToRebuildUrl = false;
  const mdnHost: string = options.meta.host as string | void
    || 'developer.mozilla.org';
  if ((host = u.host()) && host !== mdnHost) {
    let shouldReturnEarly = false;
    if (downloadableHosts[host] && u.protocol() === 'http') {
      u = u.protocol('https');
      needToRebuildUrl = true;
    }
    switch (host) {
    case 'mdn.mozillademos.org': // should be automatically redirected back
    case 'wiki.developer.mozilla.org':
    case 'developer.cdn.mozilla.net':
    case 'developer.allizom.org':
    case 'developer-stage.mdn.mozit.cloud':
    case 'developer-prod.mdn.mozit.cloud':
    case 'developer.mozilla.org':
    case 'bcd.developer.mozilla.org': // https://github.com/website-local/mdn-local/issues/890
    case 'bcd.developer.allizom.org':
    case mdnHost:
      u = u.host(mdnHost);
      needToRebuildUrl = true;
      break;
    default:
      if (externalHostMap[host]) {
        const externalHost = externalHostMap[host];
        // fake url, redirected back in redirectDownloadLink
        u = u.host(mdnHost)
          .path(externalHost.pathPrefix + u.path());
        shouldReturnEarly = true;
        break;
      }
      // https://github.com/website-local/mdn-local/issues/208
      if (host.endsWith('.mdn.mozit.cloud')) {
        if (u.protocol() === 'http') {
          u.protocol('https');
        }
        // fake url, redirected back in redirectDownloadLink
        u = u.host(mdnHost)
          .path('/mdn.mozit.cloud/' + host + u.path());
        shouldReturnEarly = true;
        break;
      }
      // https://github.com/website-local/mdn-local/issues/891
      if (host.endsWith('.mdnplay.dev')) {
        if (u.protocol() === 'http') {
          u.protocol('https');
        }
        // fake url, redirected back in redirectDownloadLink
        u = u.host(mdnHost)
          .path('/live.mdnplay.dev' + u.path());
        shouldReturnEarly = true;
        break;
      }
      if (hardCodedRedirectUrl[url]) {
        return hardCodedRedirectUrl[url];
      }
      return url;
    }
    if (shouldReturnEarly) {
      url = u.toString();
      if (hardCodedRedirectUrl[url]) {
        return hardCodedRedirectUrl[url];
      }
      return url;
    }
  }
  if (u.is('relative')) {
    const pathArr1 = url.split('/');
    if (url[0] !== '/') {
      if (redirectLocale[pathArr1[0]] || localesMap[pathArr1[0]]) {
        pathArr1[0] = locale;
        u = URI('/' + pathArr1.join('/'));
      } else if (pathArr1[0] === '..' && pathArr1[1] === '..' &&
        (redirectLocale[pathArr1[2]] || localesMap[pathArr1[2]])) {
        // ../../en-US/docs/Mercurial
        // ../../zh-cn/docs/JavaScript/Reference/Global_Objects/Map
        pathArr1.splice(0, 3, locale);
        u = URI('/' + pathArr1.join('/'));
      }
    } else if (redirectLocale[pathArr1[1]] || localesMap[pathArr1[1]]) {
      // /zh-CN/docs/https://developer.mozilla.org/en-US/docs/Web
      // /en-US/docs/https://developer.mozilla.org/zh-CN/docs/Web/API/ImageBitmap
      if ('docs' === pathArr1[2] && ('https:' === pathArr1[3] || 'http:' === pathArr1[3])) {
        if ('' === pathArr1[4] && 'developer.mozilla.org' === pathArr1[5]) {
          u = u.path('/' + pathArr1.slice(6).join('/'));
        }
      }
    }
    u = u.search('').normalizePath();
    if (parent) {
      u = u
        .absoluteTo(parent.url)
        .normalizePath();
    }
    if (parent && parent.downloadLink) {
      const downloadLink = parent.downloadLink;
      for (const externalHost of externalHosts) {
        if (downloadLink.includes(externalHost.pattern) &&
          !u.path().includes(externalHost.prefix)) {
          // fake url, redirected back in redirectDownloadLink
          return u.host(mdnHost)
            .path(externalHost.pathPrefix + u.path())
            .toString();
        }
      }
    }
    needToRebuildUrl = true;
  }
  // remove search
  if (u.search()) {
    u.search('');
    needToRebuildUrl = true;
  }
  const pathArr = u.path()
    .replace('en-\n\nUS', 'en-US')
    .split('/');
  if (u.protocol() === 'http') {
    u = u.protocol('https');
    needToRebuildUrl = true;
  }
  if (!pathArr || !pathArr[1]) {
    return needToRebuildUrl ? u.toString() : url;
  }
  if (processPathWithMultiLocale(pathArr, locale)) {
    needToRebuildUrl = true;
  }
  if (redirectLocale[pathArr[1]] || localesMap[pathArr[1]]) {
    pathArr[1] = locale;
    needToRebuildUrl = true;
  }
  if (appendLocalePath[pathArr[1]]) {
    pathArr.splice(1, 0, locale);
    needToRebuildUrl = true;
  }
  if (pathArr[1] === 'DOM') {
    pathArr.splice(1, 1, locale, 'docs', 'Web', 'API');
    needToRebuildUrl = true;
  } else if (pathArr[1] === 'zh-CNdocs' || pathArr[1] === 'en-USdocs') {
    pathArr.splice(1, 1, locale, 'docs');
    needToRebuildUrl = true;
  } else if (pathArr[2] === 'DOM') {
    pathArr.splice(1, 2, locale, 'docs', 'Web', 'API');
  }
  if (typeof pathArr[1] === 'string' &&
    locale.toLowerCase() === pathArr[1].toLocaleLowerCase()) {
    if (appendDocsWebPath[pathArr[2]]) {
      pathArr.splice(2, 0, 'docs', 'Web');
      needToRebuildUrl = true;
    } else if (appendDocsPath[pathArr[2]]) {
      pathArr.splice(2, 0, 'docs');
      needToRebuildUrl = true;
    }
  }

  if (needToRebuildUrl) {
    url = u.path(pathArr.join('/')).toString();
  }
  const mdnRedirectPath = getMdnRedirectPath(locale);
  if (mdnRedirectPath[u.path()]) {
    url = u.path(mdnRedirectPath[u.path()]).toString();
  }
  if (locale !== 'en-US' && url.match('en-US')) {
    errorLogger.warn(url, pathArr.join('/'));
  }
  if (hardCodedRedirectUrl[url]) {
    return hardCodedRedirectUrl[url];
  }
  return url;
}
