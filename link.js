const URI = require('urijs');
const path = require('path');
const got = require('got');
const fs = require('fs');
const cheerio = require('cheerio');
const mkdirP = require('mkdirp');
const defaultOptions = require('./options');
const forbiddenChar = /:\*\?"<>\|/g;

const cacheUri = {};
/**
 *
 * @param {string} url
 * @param {got.GotBodyOptions} opts
 * @return {got.GotPromise<any>}
 */
const get = (url, opts = {}) => got(url, opts);

const mkdirRetry = (dir) => {
  try {
    if (!fs.existsSync(dir)) {
      mkdirP.sync(dir);
    }
  } catch (e) {
    // in case of concurrent dir creation
    try {
      if (!fs.existsSync(dir)) {
        mkdirP.sync(dir);
      }
    } catch (e) {
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
    if (typeof this.options.requestRedirectFunc === 'function') {
      this._downloadLink =
        this.options.requestRedirectFunc(this._downloadLink, this);
    }
    const downloadLink = encodeURI(decodeURI(this._downloadLink));
    const res = await get(downloadLink,
      Object.assign({encoding: this.encoding}, this.options.req));
    if (res && res.body) {
      return this.body = res.body;
    } else {
      throw new Error(res);
    }
  }

  async save() {
    if (!this.savePath) {
      return false;
    }
    if (!this.body) {
      await this.fetch();
    }
    const savePathUnEncoded = decodeURI(this.savePath);
    if (this.encoding) {
      return await writeStr(this.body, savePathUnEncoded, this.encoding);
    }
    return await writeFile(this.body, savePathUnEncoded);
  }
}

class Resource extends Link {
  constructor(url, localRoot, refUrl, options = {}) {
    super(url, localRoot, refUrl, options);
    if (this.refUri.is('relative')) {
      throw new TypeError('refUrl必须是绝对路径');
    }
  }

  set url(url) {
    this._url = url;
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
    this.replacePath.path(replacePathStr.replace(forbiddenChar, '_'));
    this.savePath = path.join(this.localRoot, this.host,
      this.serverPath.replace(forbiddenChar, '_'));
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
    const body = await super.fetch();
    /**
     * @type CheerioStatic
     */
    return this.doc = cheerio.load(body);
  }

  async save() {
    if (!this.savePath) {
      return false;
    }
    if (this.saved) {
      return true;
    }
    if (!this.doc) {
      await this.fetch();
    }
    const savePathUnEncoded = decodeURI(this.savePath);
    const ret = await writeStr(this.html, savePathUnEncoded, this.encoding);
    this.saved = 1;
    this.doc = null;
    this.body = null;
    return ret;
  }
}

module.exports.Resource = Resource;
module.exports.HtmlResource = HtmlResource;