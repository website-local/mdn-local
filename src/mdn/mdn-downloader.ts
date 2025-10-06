import {
  SingleThreadDownloader
} from 'website-scrap-engine/lib/downloader/index.js';
import type {
  DownloadOptions,
  StaticDownloadOptions
} from 'website-scrap-engine/lib/options.js';
import {CookieJar} from 'tough-cookie';
import {HttpAgent, HttpsAgent} from 'agentkeepalive';
import {localesMap, redirectLocale} from './process-url/consts.js';
import type {Options as NormalizedOptions} from 'got';
import path from 'path';
import {defaultInitialUrl} from './process-url/default-initial-url.js';
import {mkdirpSync as mkdir} from 'mkdirp';
import {promises as fs} from 'fs';
import {CustomDnsLookup} from './custom-dns-lookup.js';
import {fileURLToPath} from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export class MdnDownloader extends SingleThreadDownloader {
  constructor(public pathToOptions: string,
    overrideOptions?: Partial<StaticDownloadOptions> & { pathToWorker?: string }) {
    super(pathToOptions, overrideOptions);
  }

  protected _internalInit(options: DownloadOptions): Promise<void> {
    const locale: string = options.meta.locale as string || 'en-US';
    const cookieJar = options.req.cookieJar = new CookieJar();
    cookieJar.setCookieSync(
      'preferredlocale=' + locale,
      'https://developer.mozilla.org');

    if (!options.req.hooks) {
      options.req.hooks = {};
    }
    if (!options.req.hooks.beforeRedirect) {
      options.req.hooks.beforeRedirect = [];
    }
    if (!options.req.headers) {
      options.req.headers = {};
    }
    if (!options.req.headers['accept-language']) {
      options.req.headers['accept-language'] = locale;
    }

    options.req.hooks.beforeRedirect.push(function (options: NormalizedOptions) {
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
    if (options.meta?.keepAlive !== false) {
      if (!options.req.agent) {
        options.req.agent = {};
      }
      if (!options.req.agent.http) {
        options.req.agent.http = new HttpAgent();
      }
      if (!options.req.agent.https) {
        options.req.agent.https = new HttpsAgent();
      }
    } else if (options.meta?.http2 !== false) {
      // enable http2
      options.req.http2 = true;
    }

    // optional prefer ipv6 config
    if (options.meta.preferIpv6) {
      let dnsCache = options.req.dnsCache;
      if (!(dnsCache instanceof CustomDnsLookup)) {
        dnsCache = new CustomDnsLookup();
        options.req.dnsCache = dnsCache;
      }
      (dnsCache as CustomDnsLookup).preferIpv6 = true;
    }
    return super._internalInit(options);
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
    fs.copyFile(path.join(dirname, 'inject', 'inject.js'),
      path.join(jsPath, 'inject.js')),
    fs.copyFile(path.join(dirname, 'inject', 'inject.css'),
      path.join(cssPath, 'inject.css')),
    // node.js 16.7+
    fs.cp(path.join(dirname, 'inject', 'icon'),
      path.join(cssPath, 'icon'), {recursive: true}),
    fs.writeFile(path.join(
      overrideOptions.localRoot,
      'developer.mozilla.org',
      'index.html'), makeIndexPagePlaceholder(locale)),
  ]);
  const downloader: MdnDownloader = new MdnDownloader(
    'file://' + path.join(dirname, 'life-cycle.js'), overrideOptions);
  downloader.queuedUrl.add('https://developer.mozilla.org/');
  downloader.queuedUrl.add('https://developer.mozilla.org/index.html');
  await downloader.init;
  downloader.start();
  return downloader;
}
