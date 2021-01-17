import {SingleThreadDownloader} from 'website-scrap-engine/lib/downloader';
import type {StaticDownloadOptions} from 'website-scrap-engine/lib/options';
import {CookieJar} from 'tough-cookie';
import HttpAgent, {HttpsAgent} from 'agentkeepalive';
import {localesMap, redirectLocale} from './process-url/consts';
import type {NormalizedOptions} from 'got/dist/source/core';
import path from 'path';
import {defaultInitialUrl} from './process-url/default-initial-url';
import {sync as mkdir} from 'mkdirp';
import {promises as fs} from 'fs';

export class MdnDownloader extends SingleThreadDownloader {
  constructor(public pathToOptions: string,
    overrideOptions?: Partial<StaticDownloadOptions> & { pathToWorker?: string }) {
    super(pathToOptions, overrideOptions);
    const locale: string = this.options.meta.locale as string || 'en-US';
    const cookieJar = this.options.req.cookieJar = new CookieJar();
    cookieJar.setCookieSync(
      'django_language=' + locale,
      'https://developer.mozilla.org');

    if (!this.options.req.hooks) {
      this.options.req.hooks = {};
    }
    if (!this.options.req.hooks.beforeRedirect) {
      this.options.req.hooks.beforeRedirect = [];
    }
    if (!this.options.req.headers) {
      this.options.req.headers = {};
    }
    if (!this.options.req.headers['accept-language']) {
      this.options.req.headers['accept-language'] = locale;
    }

    this.options.req.hooks.beforeRedirect.push(function (options: NormalizedOptions) {
      const {pathname} = options.url, pathArr = pathname.split('/');
      if (pathArr && redirectLocale[pathArr[1]]) {
        pathArr[1] = locale;
        options.url.pathname = pathArr.join('/');
      }
      options.url.search = '';
    });

    if (!this.options.req.headers) {
      this.options.req.headers = {};
    }
    if (!this.options.req.headers['accept-language']) {
      this.options.req.headers['accept-language'] = locale;
    }
    // http2 not supported yet, use http 1.1 keep-alive by default
    if (this.options.meta?.keepAlive !== false) {
      if (!this.options.req.agent) {
        this.options.req.agent = {};
      }
      this.options.req.agent.http = new HttpAgent();
      this.options.req.agent.https = new HttpsAgent();
    }
    // http2 by default
    if (this.options.meta?.http2 !== false) {
      this.options.req.http2 = true;
    } else if (this.options.meta?.keepAlive !== false) {
      // enable keep-alive if http2 disabled
      if (!this.options.req.agent) {
        this.options.req.agent = {};
      }
      if (!this.options.req.agent.http) {
        this.options.req.agent.http = new HttpAgent();
      }
      if (!this.options.req.agent.https) {
        this.options.req.agent.https = new HttpsAgent();
      }
    }
  }
}

export default async function createDownloader(
  overrideOptions: Partial<StaticDownloadOptions>,
  locale?: string
): Promise<MdnDownloader> {
  if (locale) {
    if (!overrideOptions.meta) {
      overrideOptions.meta = {};
    }
    overrideOptions.meta.locale = locale;
  }
  if (!overrideOptions.localRoot) {
    throw new TypeError('localRoot is required');
  }
  if (!locale) {
    locale = overrideOptions?.meta?.locale as string | undefined;
  }
  if (!locale || (!localesMap[locale] && locale !== 'en-US')) {
    throw new TypeError('locale not exists');
  }
  if (!overrideOptions.initialUrl?.length) {
    overrideOptions.initialUrl = defaultInitialUrl(locale);
  }
  const basePath = path.join(overrideOptions.localRoot,
      'developer.mozilla.org', 'static'),
    jsPath = path.join(basePath, 'js'),
    cssPath = path.join(basePath, 'css');
  mkdir(jsPath);
  mkdir(cssPath);
  await fs.copyFile(path.join(__dirname, 'inject', 'inject.js'),
    path.join(jsPath, 'inject.js'));
  await fs.copyFile(path.join(__dirname, 'inject', 'inject.css'),
    path.join(cssPath, 'inject.css'));
  const downloader: MdnDownloader =
    new MdnDownloader(path.join(__dirname, 'life-cycle'), overrideOptions);
  await downloader.init;
  downloader.start();
  return downloader;
}
