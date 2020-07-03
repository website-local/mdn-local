const URI = require('urijs');
const JSON5 = require('json5');
const fs = require('fs');
const path = require('path');
const log4js = require('log4js');
const gotNoRedirect = require('got').extend({
  followRedirect: false
});
const {mkdir} = require('../lib/link');
const Downloader = require('../lib/downloader');
const configureLogger = require('../lib/logger-config');
const errorLogger = log4js.getLogger('error');

const cache = {};
const asyncRedirectCache = {};

const KW_ARR_BEGIN = 'var arr = [',
  KW_ARR_END = '];',
  KW_ARR_INDEX_BEGIN = 'location.replace(arr[';

const HOST = 'nodejs.cn',
  PROTOCOL = 'http',
  URL_PREFIX = `${PROTOCOL}://${HOST}`;

const getRedirectLocation = async (link) => {
  let redirect = await gotNoRedirect(URL_PREFIX + link);
  if (redirect.statusCode === 302 && redirect.headers && redirect.headers.location) {
    cache[link] = redirect.headers.location;
    link = redirect.headers.location;
  } else if (redirect.body) {
    /**
     * @type string
     */
    let html = redirect.body;
    let arrBegin = html.indexOf(KW_ARR_BEGIN),
      arrEnd = html.indexOf(KW_ARR_END, arrBegin),
      arrIndex = html.indexOf(KW_ARR_INDEX_BEGIN, arrEnd);
    if (arrBegin > 0 && arrEnd > 0 && arrIndex > 0) {
      try {
        let arr = JSON5.parse(html.slice(arrBegin + KW_ARR_BEGIN.length - 1, arrEnd + 1));
        let i = parseInt(html.slice(arrIndex + KW_ARR_INDEX_BEGIN.length), 10);
        if (arr && !isNaN(i) && arr[i]) {
          cache[link] = arr[i];
          link = arr[i];
        } else {
          errorLogger.warn('Can not parse redirect for', link, arr, i);
        }
      } catch (e) {
        errorLogger.error('Error resolving redirect result', link, html, e);
      }
    } else {
      errorLogger.warn('Unknown redirect result format', link, html);
    }
  }
  return link;
};

const cachedGetRedirectLocation = (link) => {
  if (cache[link]) {
    return cache[link];
  }
  if (asyncRedirectCache[link]) {
    return asyncRedirectCache[link];
  }
  return asyncRedirectCache[link] = getRedirectLocation(link);
};

// the 404-not-found links
const hardCodedRedirect = {
  '/api/stream.md': '/api/stream.html',
  '/api/http/net.html': '/api/net.html',
  '/api/fs/stream.html': '/api/stream.html',
  '/api/addons/n-api.html': '/api/n-api.html',
  '/api/assert/tty.html': '/api/tty.html',
  '/api/worker_threads/errors.html': '/api/errors.html',
  '/api/process/cli.html': '/api/cli.html',
  '/api/zlib/buffer.html': '/api/buffer.html'
};

const linkRedirectFunc = async (link, elem, parent) => {
  if (link && link.startsWith('/s/')) {
    if (cache[link]) {
      link = cache[link];
    } else {
      link = await cachedGetRedirectLocation(link);
    }
  }
  let u = URI(link);
  if (u.is('relative')) {
    u = u.absoluteTo(parent.url).normalizePath();
  }
  if (hardCodedRedirect[u.path()]) {
    u = u.path(hardCodedRedirect[u.path()]);
    link = u.toString();
  }
  return link;
};

const dropResourceFunc = res => {
  return !(res.uri.host() === HOST && res.uri.path().startsWith('/api')) ||
    res.uri.path() === '/api/static/inject.css' ||
    res.uri.path() === '/api/static/favicon.png' ||
    res.uri.path() === '/api/static/inject.js';
};

const preProcessResource = (link, elem, res) => {
  let uri = URI(link);
  if (uri.host() && uri.host() !== HOST) {
    res.replacePath = uri;
  }
  if (res.replacePath.toString().startsWith('/#')) {
    // redirected hash links
    res.replacePath = URI(res.replacePath.toString().slice(1));
  }
  // fix redirected link
  if (!res.replacePath.host() && elem.is('a') && elem.attr('target') === '_blank') {
    elem.removeAttr('target');
    elem.removeAttr('rel');
  }
};

const preProcessHtml = ($) => {
  let head = $('head'), body = $('body');
  // remove comments in body
  body.contents().filter(function () {
    return this.nodeType === 8;
  }).remove();
  $('#biz_nav').remove();
  $('#biz_content').remove();
  $('#biz_item').remove();
  // remove all scripts
  $('script').remove();
  $('a[href="/"]').remove();
  $('a[href="/search"]').addClass('link-to-search');
  // style for page and prism.js
  $(`<link href="${URL_PREFIX}/api/static/inject.css" rel="stylesheet">`)
    .appendTo(head);
  // better code highlighting with prism.js
  $(`<script src="${URL_PREFIX}/api/static/inject.js" defer></script>`)
    .appendTo(body);
  // replace favicon
  $('link[rel="icon"]').remove();
  $('<link rel="icon" sizes="32x32" type="image/png" ' +
    `href="${URL_PREFIX}/api/static/favicon.png">`).appendTo(head);

  return $;
};

const postProcessHtml = ($) => {
  let array = $('a[href]');
  for (let i = 0, a, attr, href; i < array.length; i++) {
    if ((a = array[i]) &&
      (attr = a.attribs) &&
      (href = attr.href) &&
      (href = cache[href])) {
      a.attribs.href = href;
    }
  }

  $('a[href^="https://github.com/nodejscn/node-api-cn/edit/"]')
    .addClass('link-to-edit');
  return $;
};

module.exports = (localRoot, options = {}) => {
  configureLogger(localRoot, HOST);
  let d = new Downloader(Object.assign({
    beginUrl: URL_PREFIX + '/api/',
    depth: 4,
    localRoot,
    skipProcessFunc: link => !link || link.startsWith('https://github.com/'),
    linkRedirectFunc,
    dropResourceFunc,
    preProcessResource,
    preProcessHtml,
    postProcessHtml
  }, options));

  let staticPath = path.join(localRoot, 'nodejs.cn', 'api', 'static');
  mkdir(staticPath);
  fs.copyFileSync(path.join(__dirname, 'inject.css'),
    path.join(staticPath, 'inject.css'));
  fs.copyFileSync(path.join(__dirname, 'inject.js'),
    path.join(staticPath, 'inject.js'));
  fs.copyFileSync(path.join(__dirname, 'favicon.png'),
    path.join(staticPath, 'favicon.png'));
  d.start();
  return d;
};
