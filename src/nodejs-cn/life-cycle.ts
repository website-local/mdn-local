import { join } from 'path';
import URI from 'urijs';
import got from 'got';
import type {Resource} from 'website-scrap-engine/lib/resource';
import {ResourceType} from 'website-scrap-engine/lib/resource';
import {error as errorLogger} from 'website-scrap-engine/lib/logger/logger';
import type {
  ProcessingLifeCycle,
  ProcessResourceAfterDownloadFunc
} from 'website-scrap-engine/lib/life-cycle/types';
import type {
  DownloadResource,
  ProcessResourceBeforeDownloadFunc,
  SubmitResourceFunc
} from 'website-scrap-engine/lib/life-cycle/types';
import {defaultLifeCycle} from 'website-scrap-engine/lib/life-cycle';
import {
  parseHtml,
  preProcess,
  processHtml,
  skipProcess
} from 'website-scrap-engine/lib/life-cycle/adapters';
import {
  defaultDownloadOptions,
  DownloadOptions,
  StaticDownloadOptions
} from 'website-scrap-engine/lib/options';
import type {Cheerio, CheerioStatic} from 'website-scrap-engine/lib/types';

const gotNoRedirect = got.extend({
  followRedirect: false
});

const cache: Record<string, string> = {};
const asyncRedirectCache: Record<string, Promise<string>> = {};

const KW_ARR_BEGIN = 'var arr = [',
  KW_ARR_END = '];',
  KW_ARR_INDEX_BEGIN = 'location.replace(arr[';

const HOST = 'nodejs.cn',
  PROTOCOL = 'http',
  URL_PREFIX = `${PROTOCOL}://${HOST}`;

const LOCATION_REPLACE_LITERAL = 'location.replace(\'',
  LOCATION_REPLACE_LITERAL_END = '\')';


const getRedirectLocation = async (
  link: string,
  options: StaticDownloadOptions
): Promise<string> => {
  // make sure that followRedirect is false here
  const theGot = options?.req ? got.extend(options.req, {
    followRedirect: false
  }) : gotNoRedirect;
  const redirect = await theGot(
    link.startsWith('/s') ? URL_PREFIX + link : link);
  if (redirect.statusCode === 302 && redirect.headers?.location) {
    cache[link] = redirect.headers.location;
    link = redirect.headers.location;
  } else if (redirect.body) {
    /**
     * @type string
     */
    const html = redirect.body;
    const arrBegin = html.indexOf(KW_ARR_BEGIN),
      arrEnd = html.indexOf(KW_ARR_END, arrBegin),
      arrIndex = html.indexOf(KW_ARR_INDEX_BEGIN, arrEnd);
    if (arrBegin > 0 && arrEnd > 0 && arrIndex > 0) {
      try {
        const arr = JSON.parse(html.slice(
          arrBegin + KW_ARR_BEGIN.length - 1, arrEnd + 1));
        const i = parseInt(html.slice(
          arrIndex + KW_ARR_INDEX_BEGIN.length), 10);
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
      // the new redirect page since 2021
      const literalBegin = html.indexOf(LOCATION_REPLACE_LITERAL),
        literalEnd = literalBegin > 0 ?
          html.indexOf(LOCATION_REPLACE_LITERAL_END, literalBegin) : -1;
      if (literalBegin > 0 && literalEnd > 0) {
        link = html.slice(
          literalBegin + LOCATION_REPLACE_LITERAL.length, literalEnd);
      } else {
        errorLogger.warn('Unknown redirect result format', link, html);
      }
    }
  }
  // replace the api to required version
  if (options?.meta?.nodeApiPath) {
    link = link.replace(`${URL_PREFIX}/api/`,
      `${URL_PREFIX}/${options.meta.nodeApiPath}/`);
  }
  return link;
};

const cachedGetRedirectLocation = (
  link: string, options: StaticDownloadOptions
): string | Promise<string> => {
  if (cache[link]) {
    return cache[link];
  }
  if (asyncRedirectCache[link] !== undefined) {
    return asyncRedirectCache[link];
  }
  return asyncRedirectCache[link] = getRedirectLocation(link, options);
};

// the 404-not-found links
const hardCodedRedirect: Record<string, string> = {
  '/api/stream.md': '/api/stream.html',
  '/api/http/net.html': '/api/net.html',
  '/api/fs/stream.html': '/api/stream.html',
  '/api/addons/n-api.html': '/api/n-api.html',
  '/api/assert/tty.html': '/api/tty.html',
  '/api/worker_threads/errors.html': '/api/errors.html',
  '/api/process/cli.html': '/api/cli.html',
  '/api/zlib/buffer.html': '/api/buffer.html',
  '/api/dgram/errors.html': '/api/errors.html',
  '/api/net/stream.html': '/api/stream.html',
  '/api/process/stream.html': '/api/stream.html',
  '/api/worker_threads/fs.html': '/api/fs.html',
  // 14.12.0
  '/api/synopsis/cli.html': '/api/cli.html',
  // since 16.3.0
  '/api/modules/esm.md': '/api/esm.html'
};

const hardCodedRedirectFullPath: Record<string, string> = {
  // 14.9.0
  // http://nodejs.cn/api/module.html
  'http://nodejs.cn/api/modules_cjs.html#modules_cjs_the_module_wrapper':
    'http://nodejs.cn/api/modules.html#modules_the_module_wrapper',
  // 14.9.0
  // http://nodejs.cn/api/module.html
  'http://nodejs.cn/api/modules_module.html#modules_module_class_module_sourcemap':
    'http://nodejs.cn/api/module.html#module_class_module_sourcemap',
  // 14.9.0
  // http://nodejs.cn/api/module.html
  'http://nodejs.cn/api/modules/modules_module.html#modules_module_the_module_object':
    'http://nodejs.cn/api/module.html#module_the_module_object',
  'http://nodejs.cn/api/wiki.openssl.org/index.php/List_of_SSL_OP_Flags#Table_of_Options':
    'https://wiki.openssl.org/index.php/List_of_SSL_OP_Flags#Table_of_Options',
  // 16.4.0
  '/api/http_new_agent_options':
    'http://nodejs.cn/api/http.html#http_new_agent_options'
};

const redirectCache: Record<string, Record<string, string>> = {};
const redirectFullPathCache: Record<string, Record<string, string>> = {};

const getRedirectCached = (
  cache: typeof redirectCache, base: Record<string, string>
) => (options?: StaticDownloadOptions): Record<string, string> => {
  const nodeApiPath = options?.meta?.nodeApiPath as string | undefined;
  let result: Record<string, string>;
  if (nodeApiPath) {
    result = cache[nodeApiPath];
    if (!result) {
      result = {};
      const search = /\/api\//;
      const replace = `/${nodeApiPath}/`;
      for (const [k, v] of Object.entries(base)) {
        result[k.replace(search, replace)] = v.replace(search, replace);
      }
      cache[nodeApiPath] = result;
    }
    return result;
  }
  return base;
};

const getRedirect = getRedirectCached(redirectCache, hardCodedRedirect);
const getRedirectFullPath = getRedirectCached(
  redirectFullPathCache, hardCodedRedirectFullPath);

const linkRedirectFunc = async (
  link: string,
  elem: Cheerio | null,
  parent: Resource | null,
  options: StaticDownloadOptions
) => {
  if (!parent) {
    return link;
  }
  if (link && (link.startsWith('/s/') ||
    link.startsWith('http://url.nodejs.cn/'))) {
    // workaround for broken links to source code on github
    // since v14.16.1, 2021-04-22
    if (elem) {
      const text = elem.text();
      if (text?.startsWith('lib/') && text.endsWith('.js') &&
        elem.prev().is('strong') &&
        elem.prev().text()?.includes('源代码')) {
        let header = elem.parents('.interior')
          .find('header>h1');
        if (!header?.length) {
          // since 16.4.1
          header = elem.parents('.interior')
            .find('header>.header-container>h1');
        }
        const regExp = /v\d{2,}\.\d+\.\d+/;
        const match = header?.text()?.match(regExp);
        const version = match?.[0];
        if (version) {
          return cache[link] =
            `https://github.com/nodejs/node/blob/${version}/${text}`;
        }
      }
    }
    if (cache[link]) {
      link = cache[link];
    } else {
      try {
        link = await cachedGetRedirectLocation(link, options);
      } catch (e) {
        // log the error and pass on since links can be broken
        errorLogger.warn(
          'Broken redirected link', link,
          'with text', elem?.text(), 'from', parent?.rawUrl);
        return;
      }
    }
  }
  const redirectLink = getRedirectFullPath(options)[link];
  if (redirectLink) {
    link = redirectLink;
  }
  let api = 'api';
  if (options?.meta?.nodeApiPath) {
    api = options.meta.nodeApiPath as string;
    if (link[0] === '/') {
      link = link.replace(/^\/api\//, `/${api}/`);
    } else {
      link = link.replace(/^http:\/\/nodejs.cn\/api\//,
        `http://nodejs.cn/${api}/`);
    }
  }
  let u = URI(link);
  if (u.is('relative')) {
    u = u.absoluteTo(parent.url).normalizePath();
  }
  const pathArr = u.path().split('/');
  if (pathArr.length === 3 && pathArr[1] === api && pathArr[2].endsWith('.md')) {
    pathArr[2] = pathArr[2].replace(/\.md$/i, '.html');
    u.path(pathArr.join('/'));
    link = u.toString();
  }
  const redirect = getRedirect(options);
  if (redirect[u.path()]) {
    u = u.path(redirect[u.path()]);
    link = u.toString();
  }
  return link;
};

const dropResource: ProcessResourceBeforeDownloadFunc = (
  res,
  element,
  parent,
  options
): Resource => {
  let shouldDrop: boolean;
  const api = options?.meta?.nodeApiPath;
  if (api) {
    shouldDrop = !(res.uri?.host() === HOST &&
        res.uri.path().startsWith(`/${api}`)) ||
      res.uri.path() === `/${api}/static/inject.css` ||
      res.uri.path() === `/${api}/static/favicon.png` ||
      res.uri.path() === `/${api}/static/inject.js`;
  } else {
    shouldDrop = !(res.uri?.host() === HOST &&
        res.uri.path().startsWith('/api')) ||
      res.uri.path() === '/api/static/inject.css' ||
      res.uri.path() === '/api/static/favicon.png' ||
      res.uri.path() === '/api/static/inject.js';
  }
  if (shouldDrop) {
    res.shouldBeDiscardedFromDownload = true;
  }
  return res;
};

const preProcessResource = (
  link: string, elem: Cheerio | null, res: Resource | null
) => {
  if (!res) {
    return;
  }
  const uri = URI(link);
  if (uri.host() && uri.host() !== HOST) {
    res.replacePath = uri.toString();
    res.replaceUri = uri;
  }
  if (res.replacePath.toString().startsWith('/#')) {
    // redirected hash links
    res.replaceUri = URI(res.replacePath.toString().slice(1));
    res.replacePath = res.replaceUri.toString();
  }
  // fix redirected link
  if (!res.replaceUri?.host() && elem?.is('a') && elem.attr('target') === '_blank') {
    elem.removeAttr('target');
    elem.removeAttr('rel');
  }
};

const preProcessHtml: ProcessResourceAfterDownloadFunc = (
  res: DownloadResource,
  submit: SubmitResourceFunc,
  options: StaticDownloadOptions
): DownloadResource => {
  if (res.type !== ResourceType.Html) {
    return res;
  }
  if (!res.meta.doc) {
    res.meta.doc = parseHtml(res, options);
  }
  const $ = res.meta.doc;
  const head = $('head'), body = $('body');
  // remove comments in body
  // note the 'this' hack, nodeType is actually defined
  body.contents().filter(function (this: { nodeType: number }) {
    return this.nodeType === 8;
  }).remove();
  $('#biz_nav').remove();
  $('#biz_content').remove();
  $('#biz_item').remove();
  // remove all scripts
  $('script').remove();
  $('a[href="/"]').remove();
  $('a[href="/search"],a[href="http://api.nodejs.cn/"]')
    .addClass('link-to-search');
  $('a[href^="/run/"]').addClass('link-to-run');
  // style sheet, not needed since we re-implemented it
  $('link[rel="stylesheet"]').remove();
  const api = options?.meta?.nodeApiPath as string | void || 'api';
  // style for page and prism.js
  // language=HTML
  $(`
    <link href="${URL_PREFIX}/${api}/static/inject.css" rel="stylesheet">`)
    .appendTo(head);
  // better code highlighting with prism.js
  // language=HTML
  $(`
    <script src="${URL_PREFIX}/${api}/static/inject.js" defer></script>`)
    .appendTo(body);
  // replace favicon
  $('link[rel="icon"]').remove();
  // 查看其他版本 ▼
  $('li.version-picker').remove();
  $('<link rel="icon" sizes="32x32" type="image/png" ' +
    `href="${URL_PREFIX}/${api}/static/favicon.png">`).appendTo(head);

  return res;
};

const postProcessHtml = ($: CheerioStatic) => {
  const array = $('a[href]');
  for (let i = 0, a, attr, href; i < array.length; i++) {
    if ((a = array[i]) &&
      a.type === 'tag' &&
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

const postProcessSavePath = (
  res: DownloadResource,
  submit: SubmitResourceFunc,
  options: StaticDownloadOptions
): DownloadResource => {
  const api = options?.meta?.nodeApiPath;
  // res.savePath = "nodejs.cn\api-v14\index.html"
  // api = "api-v14"
  if (api && typeof api === 'string' && options?.meta?.replaceNodeApiPath) {
    const expectedPrefix = join(HOST, api);
    if (res.savePath.startsWith(expectedPrefix)) {
      res.savePath = res.savePath.replace(expectedPrefix, join(HOST, 'api'));
    }
  }
  return res;
};

const lifeCycle: ProcessingLifeCycle = defaultLifeCycle();
lifeCycle.linkRedirect.push(skipProcess(
  (link: string) => !link || link.startsWith('https://github.com/')));
lifeCycle.linkRedirect.push(linkRedirectFunc);
lifeCycle.processBeforeDownload.push(
  dropResource, preProcess(preProcessResource));
lifeCycle.processAfterDownload.unshift(preProcessHtml);
lifeCycle.processAfterDownload.push(
  processHtml(postProcessHtml), postProcessSavePath);

const options: DownloadOptions = defaultDownloadOptions(lifeCycle);
options.logSubDir = HOST;
options.maxDepth = 4;
options.concurrency = 12;
options.initialUrl = [URL_PREFIX + '/api/'];
options.req.headers = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36'
};

export default options;
