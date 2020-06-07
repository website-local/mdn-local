const URI = require('urijs');
const Downloader = require('../lib/downloader');
const configureLogger = require('../lib/logger-config');

const remapHosts = new Set([
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'code.bdstatic.com'
]);

const requestRedirectFunc = (host, url, res) => {
  let uri, path, realHost;
  if (res && (uri = URI(url)) && uri.host() === host && (path = uri.path())) {
    let pathArr = path.split('/');
    if (remapHosts.has(realHost = pathArr[1])) {
      pathArr.splice(1, 1);
      return uri.host(realHost).path(pathArr.join('/')).toString();
    }
  }
  return url;
};

const linkRedirectFunc = (targetHost, url) => {
  if (!url) return url;
  let uri = URI(url), host = uri.host();
  if (remapHosts.has(host)) {
    return uri.path('/' + host + uri.path()).host(targetHost).toString();
  }
  return url;
};

const redirectFilterFunc = (targetHost, url, res) => {
  if (!url) return url;
  let uri = URI(url), host = uri.host();
  if (!host || host === targetHost) return url;
  if (!remapHosts.has(host)) {
    return res.url;
  }
  return uri.path('/' + host + uri.path()).host(targetHost).toString();
};

const preProcessHtml = ($) => {
  // remove all scripts
  // $('script').remove();\
  $('script[src*="google-analytics"]').remove();
  $('script[src*="docsearch"]').remove();
  $('script[src*="servedby-buysellads"]').remove();
  $('script[src*="production-assets.codepen.io"]').remove();
  $('script[src*="player.vimeo.com"]').remove();
  $('script[src*="extend.vimeocdn.com"]').remove();
  $('script').each((index, elem) => {
    let text;
    elem = $(elem);
    if (!(text = elem.html())) {
      return;
    }
    if (text.includes('google-analytics') ||
      text.includes('_bsa.init') ||
      text.includes('docsearch') ||
      text.includes('\'serviceWorker\'in navigator')) {
      elem.remove();
    }
  });
  $('#search-form,#search-query-nav,#search-query-sidebar,#search-query-menu').remove();
  $('link[rel="alternate"]').remove();
  $('link[rel="preconnect"]').remove();
  $('link[rel="apple-touch-icon"]').remove();
  $('link[href*="docsearch"]').remove();
  $('link[href*="fonts.googleapis.com"]').remove();
  $('link[href*="maxcdn.bootstrapcdn.com"]').remove();
  $('#special,#sponsors,#news,#sidebar-sponsors-special,#ad').remove();
  $('#sidebar-sponsors-platinum-right').remove();
  $('#bsa-native').remove();
  $('#blm').remove();
  $('#modal-player').remove();
  $('.ad-pagetop,.vueschool,.vue-mastery,.scrimba').remove();
  $('.ais-search-box,.nav-search').addClass('hidden');
  $('footer.footer').remove();
  let axios = $('script[src*="axios"]');
  if (axios.length) {
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
  return $;
};

const postProcessHtml = ($) => {
  return $;
};

module.exports = (localRoot, host, options = {}) => {
  configureLogger(localRoot, host);
  if (!options.req) {
    options.req = {};
  }

  let d = new Downloader(Object.assign({
    beginUrl: `https://${host}/`,
    depth: 4,
    localRoot,
    skipProcessFunc: url => {
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
      let uri = URI(url);
      return uri.host() && uri.host() !== host && !remapHosts.has(uri.host());
    },
    linkRedirectFunc: (url) => linkRedirectFunc(host, url),
    requestRedirectFunc: (url, res) => requestRedirectFunc(host, url, res),
    preProcessHtml,
    postProcessHtml,
    redirectFilterFunc: (url, res) => redirectFilterFunc(host, url, res)
  }, options));

  d.start();
  return d;
};
