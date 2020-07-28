import URI from 'urijs';
import {ProcessingLifeCycle} from 'website-scrap-engine/lib/life-cycle/types';
import {
  defaultLifeCycle
} from 'website-scrap-engine/lib/life-cycle/default-life-cycle';
import {
  dropResource,
  processHtml,
  redirectFilter,
  requestRedirect,
  skipProcess
} from 'website-scrap-engine/lib/life-cycle/adapters';
import {Resource, ResourceType} from 'website-scrap-engine/lib/resource';
import {
  defaultDownloadOptions,
  DownloadOptions
} from 'website-scrap-engine/lib/options';

export const HOST = 'www.electronjs.org';

const remapHosts = new Set([
  'cloud.githubusercontent.com',
  'user-images.githubusercontent.com',
  'raw.githubusercontent.com',
  'help.ubuntu.com',
  'mdn.mozillademos.org',
  'i-msdn.sec.s-msft.com',
  'cdn.rawgit.com'
]);

const requestRedirectFunc = (url: string, res: Resource) => {
  let uri, path, realHost;
  if (res && (uri = URI(url)) && uri.host() === HOST && (path = uri.path())) {
    const pathArr = path.split('/');
    if (remapHosts.has(realHost = pathArr[1])) {
      pathArr.splice(1, 1);
      return uri.host(realHost).path(pathArr.join('/')).toString();
    }
  }
  return url;
};

const linkRedirectFunc = (url: string) => {
  if (!url) return url;
  const uri = URI(url);
  let host = uri.host();
  if (!host || host === HOST) return url;
  if (host === 'cdn.rawgit.com') {
    uri.host(host = 'raw.githubusercontent.com');
  }
  if (remapHosts.has(host)) {
    return uri.path('/' + host + uri.path()).host(HOST).toString();
  }
  return url;
};

const redirectFilterFunc = (url: string, res: Resource) => {
  if (!url) return url;
  const uri = URI(url), host = uri.host();
  if (!host || host === HOST) return url;
  if (!remapHosts.has(host)) {
    return res.url;
  }
  return uri.path('/' + host + uri.path()).host(HOST).toString();
};


const dropResourceFunc = (res: Resource) => {
  if (!res.uri) {
    res.uri = URI(res.url);
  }
  if (!res.uri.host()) {
    return false;
  }
  if (res.type === ResourceType.Html) {
    return !(res.uri.host() === HOST &&
      res.uri.path().startsWith('/docs'));
  }
  return !(res.uri.host() === HOST);
};


const preProcessHtml = ($: CheerioStatic) => {
  // remove all scripts
  $('script').remove();
  $('link[rel="alternate"]').remove();
  $('.site-header-logo').attr('href', '/docs');
  $('.site-header-nav-item:not(.active)').addClass('hidden');
  $('.ais-search-box,.nav-search').addClass('hidden');
  $('footer.footer').remove();
  $('.announcement-banner').remove();
  return $;
};

const skipProcessFunc = (url: string) => {
  if (url.startsWith('/')) {
    return false;
  }
  if (url.startsWith('#') ||
    url.startsWith('data:') ||
    url.startsWith('javascript:') ||
    url.startsWith('about:') ||
    url.startsWith('chrome:')) {
    return true;
  }
  const uri = URI(url);
  return Boolean(uri.host()) && uri.host() !== HOST && !remapHosts.has(uri.host());
};


const lifeCycle: ProcessingLifeCycle = defaultLifeCycle();
lifeCycle.linkRedirect.push(skipProcess(
  (link: string) => !link || link.startsWith('https://github.com/')));
lifeCycle.linkRedirect.push(skipProcess(skipProcessFunc));
lifeCycle.linkRedirect.push(linkRedirectFunc);
lifeCycle.processBeforeDownload.push(dropResource(dropResourceFunc));
lifeCycle.processBeforeDownload.push(requestRedirect(requestRedirectFunc));
lifeCycle.processAfterDownload.unshift(redirectFilter(redirectFilterFunc));
lifeCycle.processAfterDownload.unshift(processHtml(preProcessHtml));


const options: DownloadOptions = defaultDownloadOptions(lifeCycle);
options.logSubDir = HOST;
options.maxDepth = 5;
options.concurrency = 12;
options.initialUrl = [`https://${HOST}/docs`];
options.req.headers = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36'
};

export default options;

