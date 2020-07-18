import {StaticDownloadOptions} from 'website-scrap-engine/lib/options';
import {
  DownloadResource,
  SubmitResourceFunc
} from 'website-scrap-engine/lib/life-cycle/types';
import URI from 'urijs';
import {mdnHosts, redirectLocale} from './consts';

export function redirectUrlAfterFetch(
  res: DownloadResource,
  submit: SubmitResourceFunc,
  options: StaticDownloadOptions
): DownloadResource {
  let url = res.redirectedUrl || res.url;
  const uri = URI(url).search(''), host = uri.host();
  if (!mdnHosts[host]) {
    return res;
  }
  if (host !== 'developer.mozilla.org') {
    url = uri.host('developer.mozilla.org').toString();
  }
  const path = uri.path(), pathArr = path.split('/');
  if (redirectLocale[pathArr[1]]) {
    pathArr[1] = options.meta.locale as string;
    url = uri.path(pathArr.join('/')).toString();
  }
  res.redirectedUrl = url;
  return res;
}
