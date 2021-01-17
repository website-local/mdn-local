import URI from 'urijs';
import type {ProcessingLifeCycle} from 'website-scrap-engine/lib/life-cycle/types';
import {defaultLifeCycle} from 'website-scrap-engine/lib/life-cycle/default-life-cycle';
import {processHtml} from 'website-scrap-engine/lib/life-cycle/adapters';
import {
  defaultDownloadOptions,
  DownloadOptions
} from 'website-scrap-engine/lib/options';
import {Resource, ResourceType} from 'website-scrap-engine/lib/resource';
import type {StaticDownloadOptions} from 'website-scrap-engine/lib/options';
import type {
  DownloadResource,
  SubmitResourceFunc
} from 'website-scrap-engine/lib/life-cycle/types';
import type {Cheerio, CheerioStatic} from 'website-scrap-engine/lib/types';

const remapHosts: Set<string> = new Set([
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'code.bdstatic.com',
  'user-images.githubusercontent.com',
  's3-us-west-2.amazonaws.com',
  'images.opencollective.com',
  'webpack.github.io'
]);

const keepHosts: Set<string> = new Set([
  'cli.vuejs.org',
  'vue-loader.vuejs.org',
  // 'vue-loader-v14.vuejs.org',
  'router.vuejs.org',
  'vuex.vuejs.org',
  'ssr.vuejs.org'
]);

const skipProcessFunc = (
  url: string,
  element: Cheerio | null,
  parent: Resource | null,
  options: StaticDownloadOptions
): string | void => {
  const uri = URI(url);
  if (uri.host() &&
    uri.host() !== options.meta?.host &&
    !remapHosts.has(uri.host()) &&
    !keepHosts.has(uri.host())) {
    return;
  }
  return url;
};

const linkRedirectFunc = (
  url: string,
  element: Cheerio | null,
  parent: Resource | null,
  options: StaticDownloadOptions
): string | void => {
  const targetHost: string = options.meta?.host as string;
  if (!url) return url;
  const uri: URI = URI(url), host: string = uri.host();
  if (remapHosts.has(host)) {
    return uri.path('/' + host + uri.path()).host(targetHost).toString();
  }
  return url;
};

const requestRedirectFunc = (
  res: Resource,
  element: Cheerio | null,
  parent: Resource | null,
  options: StaticDownloadOptions
): Resource | void => {
  if (!res.downloadLink) {
    return res;
  }
  const url: string = res.downloadLink, host = options.meta?.host;
  let uri: URI, path: string, realHost: string;
  if (res && (uri = URI(url)) && uri.host() === host && (path = uri.path())) {
    const pathArr = path.split('/');
    if (remapHosts.has(realHost = pathArr[1])) {
      pathArr.splice(1, 1);
      res.downloadLink = uri.host(realHost).path(pathArr.join('/')).toString();
    }
  }
  return res;
};

const redirectFilterFunc = (
  res: DownloadResource,
  submit: SubmitResourceFunc,
  options: StaticDownloadOptions
): DownloadResource | void => {
  if (!res.redirectedUrl) {
    return res;
  }
  const uri: URI = URI(res.redirectedUrl), host: string = uri.host();
  if (!host || host === options.meta?.host) return res;
  if (!remapHosts.has(host)) {
    return res;
  }
  res.redirectedUrl = uri.path('/' + host + uri.path())
    .host(options.meta?.host as string)
    .toString();
  return res;
};

const preProcessHtml = ($: CheerioStatic, res: Resource & { type: ResourceType.Html }) => {
  // remove all scripts
  // $('script').remove();
  let path: string | string[];
  if (!res.uri) {
    res.uri = URI(res.url);
  }
  // 3rd-party pages
  if ((path = res.uri.path()) &&
    (path = path.split('/')) &&
    remapHosts.has(path[1]) ||
    keepHosts.has(res.uri.host())) {
    // remove all scripts
    $('script').remove();
  } else {
    $('script[src*="google-analytics"]').remove();
    $('script[src*="docsearch"]').remove();
    $('script[src*="servedby-buysellads"]').remove();
    $('script[src*="production-assets.codepen.io"]').remove();
    $('script[src*="player.vimeo.com"]').remove();
    $('script[src*="extend.vimeocdn.com"]').remove();
    $('script[src*="static.codepen.io"]').remove();
    $('script[src*="cdn.carbonads.com"]').remove();
    $('script').each((index, el) => {
      let text;
      const elem = $(el);
      if (!(text = elem.html())) {
        return;
      }
      if (text.includes('google-analytics') ||
        text.includes('_bsa.init') ||
        text.includes('docsearch') ||
        text.includes('\'serviceWorker\'in navigator') ||
        text.includes('var cityCoordsFor')) {
        elem.remove();
      }
    });
  }
  $('#search-form,#search-query-nav').remove();
  $('#search-query-sidebar,#search-query-menu').remove();
  $('link[rel="alternate"]').remove();
  $('link[rel="preconnect"]').remove();
  $('link[rel="prefetch"]').remove();
  $('link[rel="preload"]').remove();
  $('link[rel="apple-touch-icon"]').remove();
  $('link[href*="docsearch"]').remove();
  $('link[href*="fonts.googleapis.com"]').remove();
  $('link[href*="webpack.github.io"]').remove();
  $('link[href*="maxcdn.bootstrapcdn.com"]').remove();
  $('#special,#sponsors,#news,#sidebar-sponsors-special,#ad').remove();
  $('#sidebar-sponsors-platinum-right').remove();
  $('#bsa-native').remove();
  $('#blm').remove();
  $('#modal-player').remove();
  $('.ad-pagetop,.carbon-ads').remove();
  $('.vueschool,.vue-mastery,.scrimba').remove();
  $('.ais-search-box,.nav-search,.search-box').addClass('hidden');
  $('footer.footer').remove();
  const axios = $('script[src*="axios"]');
  if (axios.length) {
    // language=HTML
    $(`<script>
'use strict';
var axios = window.axios || {
  get: function() {
    return Promise.resolve({
        data: {
          answer: 'dummy answer for offline usage'
        }
    });
  }
};
</script>`).appendTo($('head'));
    axios.remove();
  }
  $('iframe').remove();
  $('img[src*="github.com"]').remove();
  $('img[src*="res.cloudinary.com"]').remove();
  $('img[src*="/opencollective.com"]').remove();

  return $;
};

const lifeCycle: ProcessingLifeCycle = defaultLifeCycle();
lifeCycle.linkRedirect.push(skipProcessFunc);
lifeCycle.linkRedirect.push(linkRedirectFunc);
lifeCycle.processBeforeDownload.push(requestRedirectFunc);
lifeCycle.processAfterDownload.unshift(redirectFilterFunc);
lifeCycle.processAfterDownload.unshift(processHtml(preProcessHtml));

const options: DownloadOptions = defaultDownloadOptions(lifeCycle);
options.maxDepth = 8;
options.concurrency = 16;
options.req.headers = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36'
};

export default options;

