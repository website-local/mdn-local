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
  error: log4js.getLogger('error')
};
const defaultOptions = require('./options');
const forbiddenChar = /([:*?"<>|]|%3A|%2A|%3F|%22|%3C|%3E|%7C)+/ig;

const MAX_RETRY = 20;
const MAX_RETRY_DELAY = 5000;

const cookieJar = new CookieJar();
const cacheUri = {};

const escapePath = str => str && str.replace(forbiddenChar, '_');
/**
 *
 * @param {string} url
 * @param {got.GotBodyOptions} opts
 * @return {got.GotPromise<any>}
 */
const get = got.extend({cookieJar, hooks: {
  beforeRetry: [
    (options, error, retryCount) => {
      options.retry.retries = function hackRetryDelay(iteration, error) {
        if (iteration > MAX_RETRY) {
          return 0;
        }

        if ((!error ||
        !options.retry.errorCodes.has(error.code)) &&
        (!options.retry.methods.has(error.method) ||
          !options.retry.statusCodes.has(error.statusCode))) {
          return 0;
        }

        let delay = ((2 * (iteration - 1)) * 1000) + Math.random() * 200;
        if (iteration > 2) {
          delay += 1000;
        }
        if (delay > MAX_RETRY_DELAY) {
          delay = MAX_RETRY_DELAY + (Math.random() - 0.5) * 1000;
        }
        delay |= 0;
        return delay;
      };
      (retryCount > 1 ? logger.retry.warn : logger.retry.info)
        .call(logger.retry,'retry: ', error.url, error.code, retryCount);
    }
  ]
}, headers: {
  'user-agent': 'Mozilla/5.0 (Windows NT 6.3; Win64; x64) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) ' +
    'Chrome/53.0.2785.143 Safari/537.36'
}});

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
  const uri = new URI(url);
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

const defaultOpt = (opt, defaultOpt) => {
  if (!opt) opt = {};
  if (!defaultOpt) return opt;
  for (const key of Object.keys(defaultOpt)) {
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
    const reqOptions = Object.assign({}, this.options.req, {encoding: this.encoding});
    if (this.refUrl && this.refUrl !== downloadLink) {
      const headers = Object.assign({}, reqOptions.headers);
      headers.referer = this.refUrl;
      reqOptions.headers = headers;
    }
    let res = await get(downloadLink, reqOptions);
    if (res && res.body) {
      this.finishTimestamp = Date.now();
      this.downloadTime = this.finishTimestamp - this.downloadStartTimestamp;
      this.redirectedUrl = res.url;
      return this.body = res.body;
    } else {
      // try again
      res = await get(downloadLink, reqOptions);
      if (res && res.body) {
        this.finishTimestamp = Date.now();
        this.downloadTime = this.finishTimestamp - this.downloadStartTimestamp;
        this.redirectedUrl = res.url;
        return this.body = res.body;
      } else {
        console.warn(res);
        throw new TypeError('Empty response body: ' + downloadLink);
      }
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
    this.uri = new URI(url);
    if (this.uri.is('relative')) {
      this.replacePath = this.uri.clone();
      this.uri = this.uri.absoluteTo(this.refUri);
      this._url = this.uri.toString();
    } else if (this.uri.host() !== this.refUri.host()) {
      const crossOrigin = this.uri.host();
      const crossUri = this.uri.clone().host(this.refUri.host());
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
        console.info('Detected incomplete html, try again', this._downloadLink);
        this.body = null;
        this.doc = null;
        body = await super.fetch();
      }
      // probably more retries here?
      if (!body.includes(this.options.detectIncompleteHtml)) {
        console.warn('Detected incomplete html twice', this._downloadLink);
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
      let relativePath = new URI(this.redirectedUrl).
        search('').normalizePath().relativeTo(this.uri).toString();
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
      ret = await this._save(true);
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
module.exports.Resource = Resource;
module.exports.HtmlResource = HtmlResource;
module.exports.CssResource = CssResource;
module.exports.SiteMapResource = SiteMapResource;