const URI = require('urijs');
const log4js = require('log4js');
const errorLogger = log4js.getLogger('error');
const skipExternalLogger = log4js.getLogger('skip-external');

/**
 * @param {string[]} array
 * @return {object}
 */
const arrayToMap = (array) => {
  const obj = {};
  for (const item of array) {
    obj[item] = 1;
  }
  return obj;
};

const localeArr = [
  'af', 'ar', 'az', 'bg',
  'bm', 'bn-BD', 'bn-IN',
  'ca', 'cs', 'de', 'el',
  'es', 'fa', 'fi', 'fr',
  'fy-NL', 'he', 'hi-IN',
  'hr', 'hu', 'id', 'it',
  'ja', 'ka', 'kab', 'ko',
  'ml', 'ms', 'my', 'nl',
  'pl', 'pt-BR', 'pt-PT',
  'ro', 'ru', 'sq', 'sr',
  'sr-Latn', 'sv-SE', 'ta',
  'te', 'th', 'tl', 'tr',
  'uk', 'vi', 'zh-CN', 'zh-TW'
];
const localesMap = arrayToMap(localeArr);

const redirectLocale = arrayToMap([
  'en', 'En', 'EN', 'en-US', 'en_US', 'us', 'en-us',
  'zh', 'Zh', 'cn', 'Cn',
  'zh-cn', 'xh-CN', 'Zh-cn', 'zh_CN', 'zh-US', 'zh-Hans', 'ch-ZN', 'zh_tw',
  'Ja', 'ja', 'ig', 'ga-IE', 'zu',
  'yo', 'xh', 'wo', 'tn', 'sw', 'son', 'mg',
  'ln', 'ha', 'ff', 'ee', 'bn', 'pt', 'pt-PT', 'tr', 'Tr'
]);

const appendLocalePath = arrayToMap(['docs', 'Web']);

const appendDocsWebPath = arrayToMap([
  'JavaScript', 'API', 'CSS', 'HTML',
  'Guide', 'MathML',
  'Accessibility', 'XPath'
]);

const appendDocsPath = arrayToMap([
  'Web',
  'Mozilla',
  'Core_JavaScript_1.5_Reference',
  'nsIXMLHttpRequest',
  'Learn'
]);

// manually collected
const validExtensionName = arrayToMap([
  'gif',
  'jpg', 'JPG', 'jpeg',
  'png', 'PNG',
  'svg',
  'css',
  'js', 'jsm',
  'json',
  'txt',
  'jar',
  'woff2',
  'xul',
  'zip',
  'mp3', 'ogg',
  'mp4', 'flv', 'm4v', 'mkv', 'webm',
  'msi',
  'xpi',
  'rdf',
  'pdf',
  'dia',
  'eot',
  'psd'
]);

const downloadableHosts = arrayToMap([
  'developer.mozilla.org',
  // https://github.com/myfreeer/mdn-local/issues/44
  'mdn.mozillademos.org',
  'interactive-examples.mdn.mozilla.net',
  'wiki.developer.mozilla.org',
  'unpkg.com',
  'mdn.github.io'
]);

// manually collected
const largeMp4Videos = arrayToMap([
  '/learning-area/javascript/apis/video-audio/finished/video/sintel-short.mp4',
  '/html-examples/link-rel-preload/video/sintel-short.mp4',
  '/imsc/videos/coffee.mp4',
  '/imsc/videos/stars.mp4'
]);

// manually collected
const largeWebmVideos = arrayToMap([
  '/learning-area/javascript/apis/video-audio/finished/video/sintel-short.webm',
  '/html-examples/link-rel-preload/video/sintel-short.webm'
]);

/**
 * @type {SkipProcessFunc}
 * @param {string} url
 * @param {Cheerio} element
 * @param {HtmlResource} parent
 */
const skipProcessFunc = (url, element, parent) => {
  if (url.startsWith('/')) {
    return false;
  }
  if (url.startsWith('#') ||
    url.startsWith('data:') ||
    url.startsWith('javascript:') ||
    url.startsWith('about:') ||
    url.startsWith('chrome:') ||
    // mozilla's newsgroup uri
    // docs/Archive/Meta_docs/Existing_Content_DOM_in_Mozilla
    // docs/Mozilla/Tech/XPCOM/Binary_compatibility
    url.startsWith('news:')) {
    return true;
  }
  // https:\\google.com
  // from https://developer.mozilla.org/en-US/docs/Learn/Server-side/First_steps/Introduction
  if (url.startsWith('http:\\\\') || url.startsWith('https:\\\\')) {
    url = url.replace('\\\\', '//');
  }
  let uri = URI(url), host = uri.host();
  if (host && !downloadableHosts[host]) {
    skipExternalLogger.debug('skipped external link', host, url, parent && parent.url);
    return true;
  }
  let path = uri.path();
  if (path.startsWith('/presentations/') ||
    // very large file
    path.startsWith('/files/5237/CommonControls_20130305.psd') ||
    path.startsWith('/files/5239/IconsMedia_20130305.psd') ||
    path.startsWith('/files/5241/IconsStatusBar_20130122.psd') ||
    path.startsWith('/files/5243/IconsCommunications_20130401.psd') ||
    path.startsWith('/files/5245/IconsSettings_20130415.psd') ||
    path.startsWith('/files/5247/IconsPrimaryAction_20130501.psd')) {
    skipExternalLogger.debug('skipped link to large file', url, parent && parent.url);
    return true;
  }
  return false;
};

/**
 * @type {PreProcessResourceFunc}
 * @param {string} url
 * @param {Cheerio} element
 * @param {Resource} res
 * @param {Resource} parent
 */
const preProcessResource = (url, element, res, parent) => {
  if (parent && parent._downloadLink) {
    if (parent._downloadLink.startsWith('https://interactive-examples.mdn.mozilla.net/') ||
      parent._downloadLink.startsWith('http://interactive-examples.mdn.mozilla.net/')) {
      // interactive-examples
      if (url && url[0] === '/') {
        // absolute path
        res.url = res.uri.path('/interactive-examples' + res.uri.path()).toString();
      }
      res.replacePath = res.uri.relativeTo(parent.uri);
    } else if (parent._downloadLink.startsWith('https://mdn.github.io/') ||
      parent._downloadLink.startsWith('http://mdn.github.io/')) {
      // mdn.github.io
      if (url && url[0] === '/') {
        // absolute path
        res.url = res.uri.path('/mdn-github-io' + res.uri.path()).toString();
      }
      res.replacePath = res.uri.relativeTo(parent.uri);
    }
  }
};

/**
 *
 * @param {string} url
 * @param {Cheerio} elem
 */
const detectLinkType = (url, elem) => {
  if (elem.is('a') || elem.is('iframe')) {
    const paths = url.split('/');
    if (url.includes('/@api/deki/files/')) {
      return 'binary';
    }
    if (url.includes('/docs/') ||
      url.includes('Add-ons/WebExtensions') ||
      url.includes('Add-ons/Firefox_for_Android') ||
      url.includes('Apps/Build') ||
      url.includes('JavaScript_code_modules/') ||
      url.includes('Creating_XPCOM_Components/Building_the_WebLock_UI')) {
      return 'html';
    }
    let arr;
    if (paths && paths.length &&
      (arr = paths[paths.length - 1].split('.')) && arr.length > 1) {
      if (!validExtensionName[arr[arr.length - 1].toLowerCase()]) {
        return 'html';
      } else return 'binary';
    } else {
      return 'html';
    }
  }
};

/**
 * @param {string[]} pathArr
 * @param {string} locale
 * @return {boolean}
 */
const processPathWithMultipleLocale = (pathArr, locale) => {
  if (!Array.isArray(pathArr) || !pathArr.length) {
    return false;
  }
  let foundDocs, foundLocale;
  for (let i = 0, item; i < pathArr.length; i++) {
    item = pathArr[i];
    if (item === 'docs') {
      foundDocs = true;
    } else if (localesMap[item] || redirectLocale[item]) {
      foundLocale = true;
    } else if (foundLocale && foundDocs) {
      pathArr.splice(0, i, '', locale, 'docs');
      return true;
    } else if (item) {
      return false;
    }
  }
};

/** @type {RequestRedirectFunc} */
const requestRedirectFunc = (url, res) => {
  let uri, path;
  if (res && (uri = URI(url)) &&
    uri.host() === 'developer.mozilla.org' &&
    (path = uri.path())) {
    if (path.includes('/docs/') && path.includes('$samples/')) {
      // probably example iframe
      return uri.search('').host('mdn.mozillademos.org').toString();
    }
    if (path.startsWith('/files/') && path.match(/^\/files\/\d+\//i)) {
      // static files
      return uri.search('').host('mdn.mozillademos.org').toString();
    }
    if (path.startsWith('/interactive-examples/')) {
      // interactive-examples
      // redirect back to real url
      return uri.search('')
        .host('interactive-examples.mdn.mozilla.net')
        .path(path.slice('/interactive-examples'.length))
        .toString();
    }
    if (path.startsWith('/mdn-github-io/')) {
      // mdn.github.io
      // redirect back to real url
      path = path.slice('/mdn-github-io'.length);
      // redirect large videos to small ones
      // https://github.com/myfreeer/mdn-local/issues/46
      if (largeMp4Videos[path]) {
        path = '/learning-area/html/multimedia-and-embedding/' +
          'video-and-audio-content/rabbit320.mp4';
      } else if (largeWebmVideos[path]) {
        path = '/learning-area/html/multimedia-and-embedding/' +
          'video-and-audio-content/rabbit320.webm';
      }
      return uri.search('')
        .host('mdn.github.io')
        .path(path)
        .toString();
    }
    if (path.startsWith('/unpkg-com/')) {
      // unpkg.com
      // redirect back to real url
      return uri.search('')
        .host('unpkg.com')
        .path(path.slice('/unpkg-com'.length))
        .toString();
    }
  }
  return url;
};

/**
 * @param {Resource} res
 * @param {RegExp} testLocaleRegExp
 * @param {string} locale
 * @return {boolean|*}
 */
function shouldDropResource(res, testLocaleRegExp, locale) {
  // const url = res.uri.toString();
  // if (!ret) {
  //   // eslint-disable-next-line no-console
  //   console.debug(res.uri.host(), res.uri.toString());
  // }
  const dir = res.uri.directory(),
    path = res.uri.path(),
    host = res.uri.host();
  if (host === 'mdn.mozillademos.org' && path.startsWith('/files')) {
    return;
  }
  return !downloadableHosts[host] ||
    testLocaleRegExp.test(path) ||
    path.startsWith('/search') ||
    path.startsWith('/presentations/') ||
    path.startsWith(`/${locale}/search`) ||
    path.startsWith(locale + '/search') ||
    path.startsWith('search') ||
    // fake url
    path.startsWith('/static/build/styles/inject.css') ||
    path.endsWith('$history') ||
    path.endsWith('$children') ||
    path.endsWith('$json') ||
    path.endsWith('$edit') ||
    path.endsWith('$toc') ||
    // /docs/Archive/Mozilla/Bookmark_keywords
    path.endsWith('/docs/Special:Search') ||
    path.endsWith('$translate') ||
    path.endsWith('%24history') ||
    path.endsWith('%24edit') ||
    path.endsWith('%24translate') ||
    path.includes('/users/github/login') ||
    path.includes('/users/google/login') ||
    path.includes('/users/signin') ||
    (path.includes('/profiles/') && path.endsWith('/edit')) ||
    dir.endsWith('/profiles');
}

/**
 * @param {string} url
 * @param {Resource} res
 * @param {string} locale
 * @return {string|*}
 */
function redirectUrlAfterFetch(url, res, locale) {
  let uri = URI(url).search(''), host = uri.host();
  if (host === 'mdn.mozillademos.org') {
    return uri.host('developer.mozilla.org').toString();
  }
  if (host === 'wiki.developer.mozilla.org') {
    uri = uri.host('developer.mozilla.org');
    host = uri.host();
    url = uri.toString();
  }
  if (host !== 'developer.mozilla.org') {
    return res.url;
  }
  const path = uri.path(), pathArr = path.split('/');
  if (redirectLocale[pathArr[1]]) {
    pathArr[1] = locale;
    return uri.path(pathArr.join('/')).toString();
  }
  return url;
}


function redirectLinkBeforeResourceInit(url, locale, html,
  localeLowerCase, hardCodedRedirectUrl) {
  if (url && url.trim) {
    url = url.trim();
  }
  if (!url) return url;
  if (url.startsWith('<=%=baseURL')) {
    url = url.slice('<=%=baseURL'.length);
  } else if (url.startsWith('%3Ccode%3E') && url.endsWith('%3C/code%3E')) {
    url = url.slice(10, url.length - 11);
  } else if (url.startsWith('<code>') && url.endsWith('</code>')) {
    url = url.slice(6, url.length - 7);
  } else if ((url.startsWith('<') || url.startsWith('&lt;')) &&
    (url.endsWith('>') || url.endsWith('&gt;'))) {
    if (url.startsWith('<')) {
      url = url.slice(1);
    }
    if (url.startsWith('&lt;')) {
      url = url.slice(4);
    }
    if (url.endsWith('>')) {
      url = url.slice(0, url.length - 1);
    }
    if (url.endsWith('&gt;')) {
      url = url.slice(0, url.length - 4);
    }
  }
  // https:\\google.com
  // from https://developer.mozilla.org/en-US/docs/Learn/Server-side/First_steps/Introduction
  if (url.startsWith('http:\\\\') || url.startsWith('https:\\\\')) {
    url = url.replace('\\\\', '//');
  }
  let u = URI(url), host, needToRebuildUrl = false;
  if ((host = u.host()) && host !== 'developer.mozilla.org') {
    let shouldReturnEarly = false;
    if (downloadableHosts[host] && u.protocol() === 'http') {
      u = u.protocol('https');
      needToRebuildUrl = true;
    }
    if (host === 'mdn.mozillademos.org') {
      // should be automatically redirected back
      u = u.host('developer.mozilla.org');
      needToRebuildUrl = true;
    } else if (host === 'wiki.developer.mozilla.org' ||
      host === 'developer.cdn.mozilla.net') {
      u = u.host('developer.mozilla.org');
      needToRebuildUrl = true;
    } else if (host === 'interactive-examples.mdn.mozilla.net') {
      // interactive-examples
      // fake url, redirected back in requestRedirectFunc
      u = u.host('developer.mozilla.org')
        .path('/interactive-examples' + u.path());
      shouldReturnEarly = true;
    } else if (host === 'mdn.github.io') {
      // mdn.github.io
      // fake url, redirected back in requestRedirectFunc
      u = u.host('developer.mozilla.org')
        .path('/mdn-github-io' + u.path());
      shouldReturnEarly = true;
    } else if (host === 'unpkg.com') {
      // unpkg.com
      // fake url, redirected back in requestRedirectFunc
      u = u.host('developer.mozilla.org')
        .path('/unpkg-com' + u.path());
      shouldReturnEarly = true;
    } else if (hardCodedRedirectUrl[url]) {
      return hardCodedRedirectUrl[url];
    } else {
      return url;
    }
    if (shouldReturnEarly) {
      url = u.toString();
      if (hardCodedRedirectUrl[url]) {
        return hardCodedRedirectUrl[url];
      }
      return url;
    }
  }
  if (u.is('relative')) {
    const pathArr1 = url.split('/');
    if (url[0] !== '/') {
      if (redirectLocale[pathArr1[0]] || localesMap[pathArr1[0]]) {
        pathArr1[0] = locale;
        u = URI('/' + pathArr1.join('/'));
      } else if (pathArr1[0] === '..' && pathArr1[1] === '..' &&
        (redirectLocale[pathArr1[2]] || localesMap[pathArr1[2]])) {
        // ../../en-US/docs/Mercurial
        // ../../zh-cn/docs/JavaScript/Reference/Global_Objects/Map
        pathArr1.splice(0, 3, locale);
        u = URI('/' + pathArr1.join('/'));
      }
    } else if (redirectLocale[pathArr1[1]] || localesMap[pathArr1[1]]) {
      // /zh-CN/docs/https://developer.mozilla.org/en-US/docs/Web
      // /en-US/docs/https://developer.mozilla.org/zh-CN/docs/Web/API/ImageBitmap
      if ('docs' === pathArr1[2] && ('https:' === pathArr1[3] || 'http:' === pathArr1[3])) {
        if ('' === pathArr1[4] && 'developer.mozilla.org' === pathArr1[5]) {
          u = u.path('/' + pathArr1.slice(6).join('/'));
        }
      }
    }
    u = u
      .removeSearch(['redirectlocale', 'redirectslug', 'tag', 'language', 'raw', 'section', 'size'])
      .search('')
      .absoluteTo(html.url)
      .normalizePath();
    if (html._downloadLink.includes('//interactive-examples.mdn.mozilla.net/') &&
      !u.path().includes('/interactive-examples/')) {
      // interactive-examples
      // fake url, redirected back in requestRedirectFunc
      return u.host('developer.mozilla.org')
        .path('/interactive-examples' + u.path())
        .toString();
    }
    if (html._downloadLink.includes('//mdn.github.io/') &&
      !u.path().includes('/mdn-github-io/')) {
      // mdn.github.io
      // fake url, redirected back in requestRedirectFunc
      return u.host('developer.mozilla.org')
        .path('/mdn-github-io' + u.path())
        .toString();
    }
    if (html._downloadLink.includes('//unpkg.com/') &&
      !u.path().includes('/unpkg-com/')) {
      // mdn.github.io
      // fake url, redirected back in requestRedirectFunc
      return u.host('developer.mozilla.org')
        .path('/unpkg-com' + u.path())
        .toString();
    }
    needToRebuildUrl = true;
  }
  const pathArr = u.path()
    .replace('en-\n\nUS', 'en-US')
    .split('/');
  if (!pathArr || !pathArr[1]) {
    return needToRebuildUrl ? u.toString() : url;
  }
  if (u.protocol() === 'http') {
    u = u.protocol('https');
    needToRebuildUrl = true;
  }
  if (processPathWithMultipleLocale(pathArr, locale)) {
    needToRebuildUrl = true;
  }
  if (redirectLocale[pathArr[1]] || localesMap[pathArr[1]]) {
    pathArr[1] = locale;
    needToRebuildUrl = true;
  }
  if (appendLocalePath[pathArr[1]]) {
    pathArr.splice(1, 0, locale);
    needToRebuildUrl = true;
  }
  if (pathArr[1] === 'DOM') {
    pathArr.splice(1, 1, locale, 'docs', 'Web', 'API');
    needToRebuildUrl = true;
  } else if (pathArr[1] === 'zh-CNdocs') {
    pathArr.splice(1, 1, locale, 'docs');
    needToRebuildUrl = true;
  } else if (pathArr[2] === 'DOM') {
    pathArr.splice(1, 2, locale, 'docs', 'Web', 'API');
  }
  if (typeof pathArr[1] === 'string' && localeLowerCase === pathArr[1].toLocaleLowerCase()) {
    if (appendDocsWebPath[pathArr[2]]) {
      pathArr.splice(2, 0, 'docs', 'Web');
      needToRebuildUrl = true;
    } else if (appendDocsPath[pathArr[2]]) {
      pathArr.splice(2, 0, 'docs');
      needToRebuildUrl = true;
    }
  }
  if (pathArr[1] === 'static' && pathArr[2] === 'jsi18n' && redirectLocale[pathArr[3]]) {
    pathArr[3] = locale;
    needToRebuildUrl = true;
  }
  if (needToRebuildUrl) {
    url = u.path(pathArr.join('/')).toString();
  }
  if (locale !== 'en-US' && url.match('en-US')) {
    errorLogger.warn(url, pathArr.join('/'));
  }
  if (hardCodedRedirectUrl[url]) {
    return hardCodedRedirectUrl[url];
  }
  return url;
}

/**
 * @param {string} locale
 * @return {string[]}
 */
function defaultBeginUrl(locale) {
  let strings = [
    `https://developer.mozilla.org/${locale}/docs/Web/API`,
    `https://developer.mozilla.org/${locale}/docs/Web/CSS/Reference`,
    `https://developer.mozilla.org/${locale}/docs/Web/JavaScript`,
    `https://developer.mozilla.org/${locale}/docs/Web/HTML/Index`,
    `https://developer.mozilla.org/${locale}/docs/Web/HTML/Attributes`,
    `https://developer.mozilla.org/${locale}/docs/Web/HTML/Element`,
    `https://developer.mozilla.org/${locale}/docs/Web/HTTP`,
    `https://developer.mozilla.org/${locale}/docs/Web/Tutorials`,
    `https://developer.mozilla.org/${locale}/docs/Web/Guide`,
    `https://developer.mozilla.org/${locale}/docs/Web/Accessibility`,
    `https://developer.mozilla.org/${locale}/docs/Web/Reference`,
    `https://developer.mozilla.org/${locale}/docs/Web/Web_components`,
    `https://developer.mozilla.org/${locale}/docs/Web/MathML`,
    `https://developer.mozilla.org/${locale}/docs/Web`,
    `https://developer.mozilla.org/${locale}/docs/Mozilla`,
    `https://developer.mozilla.org/${locale}/docs/Mozilla/Tech`,
    `https://developer.mozilla.org/${locale}/docs/Mozilla/Add-ons/WebExtensions`,
    `https://developer.mozilla.org/${locale}/docs/Learn`,
    `https://developer.mozilla.org/${locale}/docs/Games`,
    `https://developer.mozilla.org/${locale}/docs/Glossary`,
    `https://developer.mozilla.org/sitemaps/${locale}/sitemap.xml`
  ];
  if (locale !== 'en-US') {
    strings.push('https://developer.mozilla.org/sitemaps/en-US/sitemap.xml');
  }
  return strings;
}

module.exports = {
  localeArr,
  localesMap,
  redirectLocale,
  defaultBeginUrl,
  skipProcessFunc,
  preProcessResource,
  detectLinkType,
  requestRedirectFunc,
  shouldDropResource,
  redirectLinkBeforeResourceInit,
  redirectUrlAfterFetch,
  processPathWithMultipleLocale
};
