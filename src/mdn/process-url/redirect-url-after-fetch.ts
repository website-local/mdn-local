import type {StaticDownloadOptions} from 'website-scrap-engine/lib/options.js';
import type {
  DownloadResource,
  SubmitResourceFunc
} from 'website-scrap-engine/lib/life-cycle/types.js';
import URI from 'urijs';
import {
  externalHostMap,
  mdnHosts,
  redirectLocale
} from './consts.js';

export function redirectUrlAfterFetch(
  res: DownloadResource,
  submit: SubmitResourceFunc,
  options: StaticDownloadOptions
): DownloadResource {
  let url = res.redirectedUrl || res.url;
  const uri = URI(url).search(''), host = uri.host();
  const mdnHost: string = options.meta.host as string | void
    || 'developer.mozilla.org';
  const externalHost = externalHostMap[host];
  if (externalHost) {
    res.redirectedUrl = uri
      .host(mdnHost)
      .path(externalHost.pathPrefix + uri.path())
      .toString();
    return res;
  }
  if (!mdnHosts[host]) {
    res.redirectedUrl = res.url;
    return res;
  }
  if (host !== mdnHost) {
    url = uri.host(mdnHost).toString();
  }
  const path = uri.path(), pathArr = path.split('/');
  if (redirectLocale[pathArr[1]]) {
    pathArr[1] = options.meta.locale as string;
    url = uri.path(pathArr.join('/')).toString();
  }
  res.redirectedUrl = url;
  return res;
}
