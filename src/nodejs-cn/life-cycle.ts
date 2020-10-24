import URI from 'urijs';
import got from 'got';
import {Resource} from 'website-scrap-engine/lib/resource';
import {error as errorLogger} from 'website-scrap-engine/lib/logger/logger';
import {ProcessingLifeCycle} from 'website-scrap-engine/lib/life-cycle/types';
import {defaultLifeCycle} from 'website-scrap-engine/lib/life-cycle';
import {
  dropResource,
  preProcess,
  processHtml,
  skipProcess
} from 'website-scrap-engine/lib/life-cycle/adapters';
import {
  defaultDownloadOptions,
  DownloadOptions
} from 'website-scrap-engine/lib/options';
import {Cheerio, CheerioStatic} from 'website-scrap-engine/lib/types';

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

const getRedirectLocation = async (link: string): Promise<string> => {
  const redirect = await gotNoRedirect(URL_PREFIX + link);
  if (redirect.statusCode === 302 && redirect.headers && redirect.headers.location) {
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
        const arr = JSON.parse(html.slice(arrBegin + KW_ARR_BEGIN.length - 1, arrEnd + 1));
        const i = parseInt(html.slice(arrIndex + KW_ARR_INDEX_BEGIN.length), 10);
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

const cachedGetRedirectLocation = (link: string): string | Promise<string> => {
  if (cache[link]) {
    return cache[link];
  }
  if (asyncRedirectCache[link]) {
    return asyncRedirectCache[link];
  }
  return asyncRedirectCache[link] = getRedirectLocation(link);
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
  '/api/synopsis/cli.html': '/api/cli.html'
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
    'https://wiki.openssl.org/index.php/List_of_SSL_OP_Flags#Table_of_Options'
};

const linkRedirectFunc = async (link: string, elem: Cheerio | null, parent: Resource | null) => {
  if (!parent) {
    return link;
  }
  if (link && link.startsWith('/s/')) {
    if (cache[link]) {
      link = cache[link];
    } else {
      link = await cachedGetRedirectLocation(link);
    }
  }
  const redirectLink = hardCodedRedirectFullPath[link];
  if (redirectLink) {
    link = redirectLink;
  }
  let u = URI(link);
  if (u.is('relative')) {
    u = u.absoluteTo(parent.url).normalizePath();
  }
  const pathArr = u.path().split('/');
  if (pathArr.length === 3 && pathArr[1] === 'api' && pathArr[2].endsWith('.md')) {
    pathArr[2] = pathArr[2].replace(/\.md$/i, '.html');
    u.path(pathArr.join('/'));
    link = u.toString();
  }
  if (hardCodedRedirect[u.path()]) {
    u = u.path(hardCodedRedirect[u.path()]);
    link = u.toString();
  }
  return link;
};

const dropResourceFunc = (res: Resource): boolean => {
  return !(res.uri?.host() === HOST && res.uri.path().startsWith('/api')) ||
    res.uri.path() === '/api/static/inject.css' ||
    res.uri.path() === '/api/static/favicon.png' ||
    res.uri.path() === '/api/static/inject.js';
};

const preProcessResource = (link: string, elem: Cheerio | null, res: Resource | null) => {
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

const preProcessHtml = ($: CheerioStatic): CheerioStatic => {
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
  $('a[href="/search"]').addClass('link-to-search');
  // style for page and prism.js
  // language=HTML
  $(`<link href="${URL_PREFIX}/api/static/inject.css" rel="stylesheet">`)
    .appendTo(head);
  // better code highlighting with prism.js
  // language=HTML
  $(`<script src="${URL_PREFIX}/api/static/inject.js" defer></script>`)
    .appendTo(body);
  // replace favicon
  $('link[rel="icon"]').remove();
  $('<link rel="icon" sizes="32x32" type="image/png" ' +
    `href="${URL_PREFIX}/api/static/favicon.png">`).appendTo(head);

  return $;
};

const postProcessHtml = ($: CheerioStatic) => {
  const array = $('a[href]');
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

const lifeCycle: ProcessingLifeCycle = defaultLifeCycle();
lifeCycle.linkRedirect.push(skipProcess(
  (link: string) => !link || link.startsWith('https://github.com/')));
lifeCycle.linkRedirect.push(linkRedirectFunc);
lifeCycle.processBeforeDownload.push(dropResource(dropResourceFunc));
lifeCycle.processBeforeDownload.push(preProcess(preProcessResource));
lifeCycle.processAfterDownload.unshift(processHtml(preProcessHtml));
lifeCycle.processAfterDownload.push(processHtml(postProcessHtml));

const options: DownloadOptions = defaultDownloadOptions(lifeCycle);
options.logSubDir = HOST;
options.maxDepth = 4;
options.concurrency = 12;
options.initialUrl = [URL_PREFIX + '/api/'];
options.req.headers = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36'
};

export default options;
