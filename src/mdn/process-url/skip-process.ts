import {skip as skipExternalLogger} from 'website-scrap-engine/lib/logger/logger';
import URI from 'urijs';
import { downloadableHosts } from './consts';
import {Resource} from 'website-scrap-engine/lib/resource';

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
  // https:\\google.com
  // from https://developer.mozilla.org/en-US/docs/Learn/Server-side/First_steps/Introduction
  if (url.startsWith('http:\\\\') || url.startsWith('https:\\\\')) {
    url = url.replace('\\\\', '//');
  }
  const uri = URI(url), host = uri.host();
  if (host && !downloadableHosts[host]) {
    skipExternalLogger.debug('skipped external link', host, url, parent && parent.url);
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
    skipExternalLogger.debug('skipped link to large file', url, parent && parent.url);
    return;
  }
  return url;
};
