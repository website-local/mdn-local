import {
  error as errorLogger,
  skipExternal as skipExternalLogger
} from 'website-scrap-engine/lib/logger/logger.js';
import URI from 'urijs';
import {downloadableHosts} from './consts.js';
import type {Resource} from 'website-scrap-engine/lib/resource.js';
import type {Cheerio} from 'website-scrap-engine/lib/types.js';

// https://github.com/myfreeer/mdn-local/issues/34
const remoteFavicon = new Set([
  'http://www.mozilla.org/favicon.ico',
  'https://mozorg.cdn.mozilla.net/media/img/favicon.ico',
  'http://w3c.org/2008/site/images/favicon.ico'
]);

export const skipProcess = (
  url: string,
  element: Cheerio | null,
  parent: Resource | null
): string | void => {
  if (url.startsWith('/')) {
    return url;
  }
  if (url.startsWith('#') ||
    url.startsWith('data:') ||
    url.startsWith('javascript:') ||
    url.startsWith('about:') ||
    url.startsWith('chrome:') ||
    // mozilla's newsgroup uri
    // docs/Archive/Meta_docs/Existing_Content_DOM_in_Mozilla
    // docs/Mozilla/Tech/XPCOM/Binary_compatibility
    url.startsWith('news:') ||
    url.startsWith('irc:')) {
    return;
  }
  // https://github.com/myfreeer/mdn-local/issues/34
  // https://github.com/mdn/yari/pull/39
  // https://github.com/website-local/mdn-local/issues/211
  if (remoteFavicon.has(url)) {
    return 'https://developer.mozilla.org/favicon.ico';
  }
  // https:\\google.com
  // from https://developer.mozilla.org/en-US/docs/Learn/Server-side/First_steps/Introduction
  if (url.startsWith('http:\\\\') || url.startsWith('https:\\\\')) {
    url = url.replace('\\\\', '//');
  }
  const uri = URI(url), host = uri.host();
  // https://github.com/website-local/mdn-local/issues/208
  if (host && !downloadableHosts[host] &&
    !host.endsWith('.mdn.mozit.cloud')&&
    // https://github.com/website-local/mdn-local/issues/891
    !host.endsWith('.mdnplay.dev') &&
    !url.startsWith('https://www.mozilla.org/images/') &&
    !url.startsWith('https://www.mozilla.org/media/img/')) {
    skipExternalLogger.debug('skipped external link', host, url, parent?.url);
    return;
  }
  // 20240503 a bad like to https://raw.githubusercontent.com/
  // src: https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest_API
  if (element?.is('a') && url === 'https://raw.githubusercontent.com/') {
    skipExternalLogger.debug('skipped external link', host, url, parent?.url);
    return;
  }
  // special path for peach.blender.org
  // this site is not a static file cdn
  // Also referenced here:
  // https://mdn.github.io/dom-examples/fullscreen-api/index.html
  // https://developer.mozilla.org/en-US/docs/Web/Guide/Audio_and_video_delivery
  if ((host === 'peach.blender.org' || host === 'archive.org') && (!element ||
    !element.is('img') && !element.is('video') && !element.is('audio') &&
    !element.is('source') && !element.is('style'))) {
    skipExternalLogger.debug('skipped external link', host, url, parent?.url);
    return;
  }
  // incorrectly parsed url
  // localhost:3000
  // from https://developer.mozilla.org/zh-CN/docs/Learn/Tools_and_testing/
  // Client-side_JavaScript_frameworks/React_getting_started
  if (uri.is('absolute') && !host) {
    errorLogger.info('skipped incorrectly parsed url', url, parent?.url);
    return;
  }
  // New playground
  // https://github.com/website-local/mdn-local/issues/1105
  if (element?.is('iframe') && element.attr('data-playground')) {
    return;
  }

  const path = uri.path();
  if (path.startsWith('/presentations/') ||
    // very large file
    path.startsWith('/files/5237/CommonControls_20130305.psd') ||
    path.startsWith('/files/5239/IconsMedia_20130305.psd') ||
    path.startsWith('/files/5241/IconsStatusBar_20130122.psd') ||
    path.startsWith('/files/5243/IconsCommunications_20130401.psd') ||
    path.startsWith('/files/5245/IconsSettings_20130415.psd') ||
    path.startsWith('/files/5247/IconsPrimaryAction_20130501.psd')) {
    skipExternalLogger.debug('skipped link to large file', url, parent?.url);
    return;
  }
  return url;
};
