const URI = require('urijs');
const path = require('path');
const got = require('got');
const fs = require('fs');
const cheerio = require('cheerio');
const mkdirP = require('mkdirp');
const parseCssUrls = require('css-url-parser');
const {CookieJar} = require('tough-cookie');
const log4js = require('log4js');
const logger = {
  retry: log4js.getLogger('retry'),
  mkdir: log4js.getLogger('mkdir'),
  request: log4js.getLogger('request'),
  response: log4js.getLogger('response'),
  error: log4js.getLogger('error')
};
const defaultOptions = require('./options');
const forbiddenChar = /([:*?"<>|]|%3A|%2A|%3F|%22|%3C|%3E|%7C)+/ig;
const sleep = ms => new Promise(r => setTimeout(r, ms));

const cookieJar = new CookieJar();
const cacheUri = {};
const dnsCache = new Map();

const escapePath = str => str && str.replace(forbiddenChar, '_');
/**
 * @type {GotFunction}
 */
const get = got.extend({
  cookieJar, dnsCache, hooks: {
    beforeRetry: [
      (options, error, retryCount) => {
        let url = error.url;
        if (!url && error.options) {
          url = error.options.url;
          if (typeof url !== 'string') {
            url = String(url);
          }
        }
        (retryCount > 1 ? logger.retry.warn : logger.retry.info)
          .call(logger.retry, retryCount, url, error.name, error.code, error.message);
      }
    ]
  }
});

/**
 * workaround for retry premature close on node 12
 * retry on empty body
 *
 * @param url
 * @param options
 * @return {Promise<GotResponse>}
 */
const getRetry = async (url, options) => {
  /** @type {GotResponse} */
  let res;
  let err, optionsClone;
  for (let i = 0; i < 25; i++) {
    err = void 0;
    try {
      optionsClone = Object.assign({}, options);
      res = await get(url, optionsClone);
      if (!res || !res.body || !res.body.length) {
        logger.retry.warn(i, url, 'retry on empty response or body', res && res.body);
        continue;
      }
      break;
    } catch (e) {
      err = e;
      if (e && e.message === 'premature close') {
        logger.retry.warn(i, url, 'retry on premature close', e.message, e.name);
        await sleep(i * 200);
        continue;
      }
      if (e && e.name === 'RequestError' &&
        e.message === 'Cannot read property \'address\' of undefined') {
        logger.retry.warn(i, url, 'retry on cacheable-lookup error', e.message, e.name);
        await sleep(i * 150);
        continue;
      }
      if (e && e.name === 'RequestError' && e.code === 'ETIMEDOUT') {
        logger.retry.warn(i, url, 'retry on request timeout', e.message, e.name);
        await sleep(i * 150);
        continue;
      }
      if (e && e.name === 'TimeoutError' &&
        (e.event === 'lookup' || e.event === 'socket' ||
          e.event === 'connect' || e.event === 'secureConnect')) {
        // GotError: Timeout awaiting 'lookup' for 1000ms
        logger.retry.warn(i, url, `retry on ${e.event} timeout`, e.message, e.name);
        await sleep(i * 150);
        continue;
      }
      throw e;
    }
  }
  if (err) {
    logger.error.error(url, 'no more retries on premature close or timeout',
      err.message, err.name, err);
    throw err;
  }
  return res;
};

const mkdirRetry = (dir) => {
  try {
    if (!fs.existsSync(dir)) {
      mkdirP.sync(dir);
    }
  } catch (e) {
    logger.mkdir.trace('mkdir ', dir, 'fail', e);
    // in case of concurrent dir creation
    try {
      if (!fs.existsSync(dir)) {
        mkdirP.sync(dir);
      }
    } catch (e) {
      logger.mkdir.debug('mkdir ', dir, 'fail again', e);
      // try again, 3 times seeming pretty enough
      if (!fs.existsSync(dir)) {
        mkdirP.sync(dir);
      }
    }
  }
};

/**
 * 缓存的URI
 * @param {string} url
 * @param {boolean} enabled
 * @return {URI}
 */
const uriOf = (url, enabled = false) => {
  if (enabled && url in cacheUri && cacheUri[url] instanceof URI) {
    return cacheUri[url];
  }
  const uri = URI(url);
  if (enabled) {
    return cacheUri[url] = uri;
  }
  return uri;
};

const writeFile = (buffer, filePath) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    mkdirRetry(dir);
  }
  return new Promise(resolve =>
    fs.writeFile(filePath, buffer, resolve));
};

const writeStr = (str, filePath, encoding = 'utf8') => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    mkdirRetry(dir);
  }
  return new Promise(resolve =>
    fs.writeFile(filePath, str, {encoding}, resolve));
};

const defaultOpt = (opt, defOpt) => {
  if (!opt) opt = {};
  if (!defOpt) return opt;
  if (opt.req && opt.req !== defOpt.req) {
    opt.req = Object.assign({}, defOpt.req, opt.req);
  }
  for (const key of Object.keys(defOpt)) {
    if (!(key in opt)) {
      opt[key] = defaultOptions[key];
    }
  }
  return opt;
};

class Link {
  constructor(url, localRoot, refUrl, options = {}) {
    this.options = defaultOpt(options, defaultOptions);
    this.encoding = this.options.encoding.buffer;
    if (typeof this.options.urlFilter === 'function') {
      url = this.options.urlFilter(url);
    }
    this.refUrl = refUrl;
    this.createTimestamp = Date.now();
    this.refUri = uriOf(refUrl, this.options.cacheUri);
    if (url.startsWith('//')) {
      // url with the same protocol
      url = this.refUri.protocol() + ':' + url;
    } else if (url[0] === '/') {
      // absolute path
      url = this.refUri.protocol() + '://' + this.refUri.host() + url;
    }
    this.uri = uriOf(url, this.options.cacheUri);
    this.savePath = '';
    this.localRoot = localRoot;
    this._downloadLink = url;
    /**
     * @type {number}
     */
    this.depth = 0;
    /**
     * 远程路径
     * @type string
     */
    this.url = url;
    this.body = null;
  }

  equals(link) {
    return link && link.url === this.url;
  }

  toString() {
    return this.url;
  }

  async fetch() {
    if (this.body) return this.body;
    if (!this.downloadStartTimestamp) {
      this.downloadStartTimestamp = Date.now();
      this.waitTime = this.downloadStartTimestamp - this.createTimestamp;
    }
    if (typeof this.options.requestRedirectFunc === 'function') {
      this._downloadLink =
        this.options.requestRedirectFunc(this._downloadLink, this);
    }
    const downloadLink = encodeURI(decodeURI(this._downloadLink));
    const reqOptions = Object.assign({}, this.options.req);
    if (this.encoding) {
      reqOptions.encoding = this.encoding;
      reqOptions.responseType = 'text';
    } else {
      reqOptions.responseType = 'buffer';
    }
    if (this.refUrl && this.refUrl !== downloadLink) {
      const headers = Object.assign({}, reqOptions.headers);
      headers.referer = this.refUrl;
      reqOptions.headers = headers;
    }
    logger.request.info(this.url, downloadLink, this.refUrl,
      this.encoding, this.constructor.name);
    /** @type {GotResponse} */
    let res = await getRetry(downloadLink, reqOptions);
    if (res && res.body) {
      logger.response.info(res.statusCode, res.requestUrl, this.url,
        downloadLink, this.refUrl, this.encoding, this.constructor.name);
      this.finishTimestamp = Date.now();
      this.downloadTime = this.finishTimestamp - this.downloadStartTimestamp;
      this.redirectedUrl = res.url;
      return this.body = res.body;
    } else {
      logger.error.warn(res);
      throw new TypeError('Empty response body: ' + downloadLink);
    }
  }

  _save() {
    const savePathUnEncoded = decodeURI(this.savePath);
    if (this.encoding) {
      return writeStr(this.body, savePathUnEncoded, this.encoding);
    }
    return writeFile(this.body, savePathUnEncoded);
  }

  async save() {
    if (!this.savePath) {
      return false;
    }
    this.saving = 1;
    if (!this.body) {
      await this.fetch();
    }
    let ret = await this._save();
    if (this.redirectedUrl && typeof this.options.redirectFilterFunc === 'function') {
      this.redirectedUrl = this.options.redirectFilterFunc(this.redirectedUrl, this);
    }
    if (this.redirectedUrl && this.url !== this.redirectedUrl) {
      this.url = this.redirectedUrl;
      ret = await this._save();
    }
    this.saving = 0;
    this.saved = 1;
    return ret;
  }
}

class Resource extends Link {
  constructor(url, localRoot, refUrl, options = {}) {
    super(url, localRoot, refUrl, options);
    if (this.refUri.is('relative')) {
      throw new TypeError('refUrl must be absolute path');
    }
  }

  set url(url) {
    this._url = url;
    this.uri = URI(url);
    if (this.uri.is('relative')) {
      this.replacePath = this.uri.clone();
      this.uri = this.uri.absoluteTo(this.refUri);
      this._url = this.uri.toString();
    } else if (this.uri.host() !== this.refUri.host()) {
      const crossOrigin = this.uri.host();
      const crossUri = this.uri.clone()
        .host(this.refUri.host())
        .protocol(this.refUri.protocol());
      crossUri.path(crossOrigin + '/' + crossUri.path());
      this.replacePath = crossUri.relativeTo(this.refUri);
      this.replacePath.path('../' + this.replacePath.path());
    } else {
      this.replacePath = this.uri.relativeTo(this.refUri);
    }
    this.host = this.uri.hostname();
    this.serverPath = this.uri.path();
    // escape char for windows path
    const replacePathStr = this.replacePath.path();
    this.replacePath.path(escapePath(replacePathStr));
    this.savePath = path.join(this.localRoot, this.host, escapePath(this.serverPath));
    this._downloadLink = this.uri.clone().hash('').toString();
  }

  get url() {
    return this._url;
  }

  get replaceStr() {
    return this.replacePath.toString();
  }
}

class HtmlResource extends Resource {
  constructor(url, localRoot, refUrl, options = {}) {
    super(url, localRoot, refUrl, options);
    /**
     * @type {string|null}
     */
    this.encoding = this.options.encoding.html;
  }

  set url(url) {
    super.url = url;
    if (!this.savePath.endsWith('.html')) {
      if (this.savePath.endsWith('/') || this.savePath.endsWith('\\')) {
        this._appendSuffix('index.html');
      } else if (this.savePath.endsWith('.htm')) {
        this._appendSuffix('l');
      } else {
        this._appendSuffix('.html');
      }
    }
  }

  get url() {
    return super.url;
  }

  /**
   *
   * @param {string} suffix
   * @private
   */
  _appendSuffix(suffix) {
    this.savePath += suffix;
    const path = this.replacePath.path();
    this.replacePath.path(path + suffix);
  }

  /**
   * 获取HTML字符串
   * @return {string}
   */
  get html() {
    if (this.doc) {
      return this.doc.html();
    }
    return '';
  }

  async fetch() {
    if (this.doc) {
      return this.doc;
    }
    /**
     * @type string
     */
    let body = await super.fetch();
    if (this.options.detectIncompleteHtml && typeof this.body === 'string') {
      if (!body.includes(this.options.detectIncompleteHtml)) {
        logger.error.info('Detected incomplete html, try again', this._downloadLink);
        this.body = null;
        this.doc = null;
        body = await super.fetch();
      }
      // probably more retries here?
      if (!body.includes(this.options.detectIncompleteHtml)) {
        logger.error.warn('Detected incomplete html twice', this._downloadLink);
      }
    }
    this.finishTimestamp = Date.now();
    this.downloadTime = this.finishTimestamp - this.downloadStartTimestamp;
    if (this.doc) {
      return this.doc;
    }
    /**
     * @type CheerioStatic
     */
    return this.doc = cheerio.load(body);
  }

  _save(placeholder) {
    const savePathUnEncoded = decodeURI(this.savePath);
    if (placeholder) {
      let relativePath = URI(this.redirectedUrl)
        .search('').normalizePath().relativeTo(this.uri).toString();
      if (relativePath.endsWith('/')) {
        relativePath += 'index.html';
      } else {
        relativePath += '.html';
      }
      relativePath = escapePath(relativePath);
      // noinspection HtmlRequiredTitleElement
      return writeStr(`<html lang="en">
<head>
<meta http-equiv="refresh" content="0; url=${relativePath}">
<script>location.replace('${relativePath}');</script>
</head>
</html>`, savePathUnEncoded, this.encoding);
    }
    return writeStr(this.html, savePathUnEncoded, this.encoding);
  }

  async save() {
    if (!this.savePath) {
      return false;
    }
    if (this.saved) {
      return true;
    }
    this.saving = 1;
    if (!this.doc) {
      await this.fetch();
    }
    let ret;
    if (this.redirectedUrl && typeof this.options.redirectFilterFunc === 'function') {
      this.redirectedUrl = this.options.redirectFilterFunc(this.redirectedUrl, this);
    }
    if (this.redirectedUrl && this.url !== this.redirectedUrl) {
      await this._save(true);
      this.url = this.redirectedUrl;
      ret = await this._save();
    } else {
      ret = await this._save();
    }
    this.saving = 0;
    this.saved = 1;
    this.doc = null;
    this.body = null;
    return ret;
  }
}

class CssResource extends Resource {
  constructor(url, localRoot, refUrl, options = {}) {
    super(url, localRoot, refUrl, options);
    /**
     * @type {string|null}
     */
    this.encoding = this.options.encoding.css;
  }

  async fetch() {
    const body = await super.fetch();
    this.urls = parseCssUrls(body);
  }
}

class SiteMapResource extends Resource {
  constructor(url, localRoot, refUrl, options = {}) {
    super(url, localRoot, refUrl, options);
    /**
     * @type {string|null}
     */
    this.encoding = this.options.encoding.html;
  }
}

module.exports.cookieJar = cookieJar;
module.exports.dnsCache = dnsCache;
module.exports.mkdir = mkdirRetry;
module.exports.Resource = Resource;
module.exports.HtmlResource = HtmlResource;
module.exports.CssResource = CssResource;
module.exports.SiteMapResource = SiteMapResource;
