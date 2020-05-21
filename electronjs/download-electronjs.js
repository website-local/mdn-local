const URI = require('urijs');
const {cookieJar, HtmlResource} = require('../lib/link');
const Downloader = require('../lib/downloader');
const configureLogger = require('../lib/logger-config');

const HOST = 'www.electronjs.org';

const remapHosts = new Set([
  'cloud.githubusercontent.com',
  'raw.githubusercontent.com',
  'help.ubuntu.com',
  'mdn.mozillademos.org',
  'i-msdn.sec.s-msft.com'
]);

/** @type {RequestRedirectFunc} */
const requestRedirectFunc = (url, res) => {
  let uri, path, realHost;
  if (res && (uri = URI(url)) && uri.host() === HOST && (path = uri.path())) {
    let pathArr = path.split('/');
    if (remapHosts.has(realHost = pathArr[1])) {
      pathArr.splice(1, 1);
      return uri.host(realHost).path(pathArr.join('/')).toString();
    }
  }
  return url;
};

const linkRedirectFunc = (url) => {
  if (!url) return url;
  let uri = URI(url), host = uri.host();
  if (!host || host === HOST) return url;
  if (host === 'cdn.rawgit.com') {
    uri.host(host = 'raw.githubusercontent.com');
  }
  if (remapHosts.has(host)) {
    return uri.path('/' + host + uri.path()).host(HOST).toString();
  }
  return url;
};

const redirectFilterFunc = (url, res) => {
  if (!url) return url;
  let uri = URI(url), host = uri.host();
  if (!host || host === HOST) return url;
  if (!remapHosts.has(host)) {
    return res.url;
  }
  return uri.path('/' + host + uri.path()).host(HOST).toString();
};


const dropResourceFunc = res => {
  if (!res.uri.host()) {
    return;
  }
  if (res instanceof HtmlResource) {
    return !(res.uri.host() === HOST &&
      res.uri.path().startsWith('/docs'));
  }
  return !(res.uri.host() === HOST);
};


const preProcessHtml = ($) => {
  // remove all scripts
  $('script').remove();
  $('link[rel="alternate"]').remove();
  $('.site-header-logo').attr('href', '/docs');
  $('.site-header-nav-item:not(.active)').addClass('hidden');
  $('.ais-search-box,.nav-search').addClass('hidden');
  $('footer.footer').remove();
  return $;
};

/**
 * @param {string} url
 */
const skipProcessFunc = (url) => {
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
  return uri.host() && uri.host() !== HOST && !remapHosts.has(uri.host());
};

const postProcessHtml = ($) => {
  return $;
};

const setCookie = (cookie, url) =>
  new Promise(r => cookieJar.setCookie(cookie, url, r));

module.exports = async (localRoot, locale, options = {}) => {
  configureLogger(localRoot, HOST);
  if (!options.req) {
    options.req = {};
  }
  if (!('dnsCache' in options.req)) {
    options.req.dnsCache = false;
  }
  if (!options.req.headers) {
    options.req.headers = {};
  }
  if (!options.req.headers['accept-language']) {
    options.req.headers['accept-language'] = locale;
  }

  let d = new Downloader(Object.assign({
    beginUrl:  `https://${HOST}/docs/`,
    depth: 4,
    localRoot,
    skipProcessFunc,
    dropResourceFunc,
    linkRedirectFunc,
    requestRedirectFunc,
    preProcessHtml,
    postProcessHtml,
    redirectFilterFunc
  }, options));

  await setCookie('language=' + locale,
    `https://${HOST}`);

  d.start();
  return d;
};
