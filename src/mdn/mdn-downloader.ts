import {
  SingleThreadDownloader
} from 'website-scrap-engine/lib/downloader/index.js';
import type {StaticDownloadOptions} from 'website-scrap-engine/lib/options.js';
import {CookieJar} from 'tough-cookie';
import {HttpAgent, HttpsAgent} from 'agentkeepalive';
import {localesMap, redirectLocale} from './process-url/consts.js';
import type {Options as NormalizedOptions} from 'got';
import path from 'path';
import {defaultInitialUrl} from './process-url/default-initial-url.js';
import {mkdirpSync as mkdir} from 'mkdirp';
import {promises as fs} from 'fs';
import {CustomDnsLookup} from './custom-dns-lookup.js';

export class MdnDownloader extends SingleThreadDownloader {
  constructor(public pathToOptions: string,
    overrideOptions?: Partial<StaticDownloadOptions> & { pathToWorker?: string }) {
    super(pathToOptions, overrideOptions);
    const locale: string = this.options.meta.locale as string || 'en-US';
    const cookieJar = this.options.req.cookieJar = new CookieJar();
    cookieJar.setCookieSync(
      'preferredlocale=' + locale,
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
      const optionsUrl = options.url;
      if (!optionsUrl) {
        return;
      }
      const url = typeof optionsUrl === 'string' ? new URL(optionsUrl) : optionsUrl;
      const {pathname} = url, pathArr = pathname.split('/');
      if (pathArr && redirectLocale[pathArr[1]]) {
        pathArr[1] = locale;
        url.pathname = pathArr.join('/');
      }
      url.search = '';
      options.url = url;
    });

    // use http 1.1 keep-alive by default
    if (this.options.meta?.keepAlive !== false) {
      if (!this.options.req.agent) {
        this.options.req.agent = {};
      }
      if (!this.options.req.agent.http) {
        this.options.req.agent.http = new HttpAgent();
      }
      if (!this.options.req.agent.https) {
        this.options.req.agent.https = new HttpsAgent();
      }
    } else if (this.options.meta?.http2 !== false) {
      // enable http2
      this.options.req.http2 = true;
    }

    // optional prefer ipv6 config
    if (this.options.meta.preferIpv6) {
      let dnsCache = this.options.req.dnsCache;
      if (!(dnsCache instanceof CustomDnsLookup)) {
        dnsCache = new CustomDnsLookup();
        this.options.req.dnsCache = dnsCache;
      }
      (dnsCache as CustomDnsLookup).preferIpv6 = true;
    }
  }
}

function makeIndexPagePlaceholder(locale: string) {
  return `<html lang="en">
<head>
<meta charset="utf8">
<meta http-equiv="refresh" content="0; url=${locale}/index.html">
<script>location.replace('${locale}/index.html' + location.hash);</script>
<title>Redirecting</title>
</head>
</html>`;
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
  await Promise.all([
    fs.copyFile(path.join(__dirname, 'inject', 'inject.js'),
      path.join(jsPath, 'inject.js')),
    fs.copyFile(path.join(__dirname, 'inject', 'inject.css'),
      path.join(cssPath, 'inject.css')),
    fs.writeFile(path.join(
      overrideOptions.localRoot,
      'developer.mozilla.org',
      'index.html'), makeIndexPagePlaceholder(locale)),
  ]);
  const downloader: MdnDownloader =
    new MdnDownloader(path.join(__dirname, 'life-cycle'), overrideOptions);
  downloader.queuedUrl.add('https://developer.mozilla.org/');
  downloader.queuedUrl.add('https://developer.mozilla.org/index.html');
  await downloader.init;
  downloader.start();
  return downloader;
}
