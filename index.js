const URI = require('urijs');
const errorLogger = require('log4js').getLogger('error');

const {cookieJar} = require('./link');
const Downloader = require('./downloader');
const {preProcessHtml, postProcessHtml} = require('./mdn-process-html');
const configureLogger = require('./logger-config');

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
const localesMap = (() => {
  const obj = {};
  for (const locale of localeArr) {
    obj[locale] = 1;
  }
  return obj;
})();

const redirectLocale = {
  'en': 1,
  'En': 1,
  'EN': 1,
  'en-US': 1,
  'en_US': 1,
  'zh': 1,
  'Zh': 1,
  'Ja': 1,
  'ja': 1,
  'ig': 1,
  'cn': 1,
  'us': 1,
  'zh-cn': 1,
  'xh-CN': 1,
  'zh_tw': 1,
  'zh-US': 1,
  'en-us': 1,
  'Zh-cn': 1,
  'zh_CN': 1,
  'ga-IE': 1,
  'zu': 1,
  'yo': 1,
  'xh': 1,
  'wo': 1,
  'tn': 1,
  'sw': 1,
  'son': 1,
  'mg': 1,
  'ln': 1,
  'ha': 1,
  'ff': 1,
  'ee': 1,
  'Cn': 1,
  'bn': 1
};

const appendLocalePath = {
  'docs': 1,
  'Web': 1
};

const appendDocsWebPath = {
  'JavaScript': 1,
  'MathML': 1,
  'API': 1,
  'Guide': 1,
  'CSS': 1,
  'HTML': 1,
  'Accessibility': 1,
  'XPath': 1
};

const appendDocsPath = {
  'Web': 1,
  'Mozilla': 1,
  'Core_JavaScript_1.5_Reference': 1,
  'nsIXMLHttpRequest': 1,
  'Learn': 1
};

// manually collected
const validExtensionName = {
  'css': 1,
  'gif': 1,
  'jpg': 1,
  'JPG': 1,
  'jpeg': 1,
  'js': 1,
  'jsm': 1,
  'json': 1,
  'jar': 1,
  'png': 1,
  'PNG': 1,
  'svg': 1,
  'txt': 1,
  'woff2': 1,
  'xul': 1,
  'zip': 1,
  'mp4': 1,
  'flv': 1,
  'm4v': 1,
  'mkv': 1,
  'msi': 1,
  'xpi': 1,
  'rdf': 1
};


// hard coded redirect url map to avoid the max-redirect things
const hardCodedRedirectUrl = require('./redirect-url');

/**
 *
 * @param {string} url
 * @param {Cheerio} element
 */
const skipProcessFunc = (url, element) => {
  if (url.startsWith('/')) {
    return false;
  }
  return url.startsWith('#') ||
    element && (element.hasClass('external-icon') || element.hasClass('external'));
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
 *
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

const downloadMdn = (localRoot, locale = 'zh-CN', options = {}) => {
  if (!localesMap[locale]) {
    throw new TypeError('locale not exists');
  }
  configureLogger(localRoot);
  const testLocaleRegExp =
    new RegExp(`/(${localeArr.filter(l => l !== locale).join('|')})\\//`, 'i');
  const localeLowerCase = locale.toLocaleLowerCase();

  const dropResourceFunc = (res) => {
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
    return host !== 'developer.mozilla.org' ||
      path === '/presentations/screencasts/jresig-digg-firebug-jquery.mp4' ||
      testLocaleRegExp.test(path) ||
      path.startsWith('/search') ||
      path.startsWith('/zh-CN/search') ||
      path.startsWith('zh-CN/search') ||
      path.startsWith('search') ||
      path.endsWith('$history') ||
      path.endsWith('$samples') ||
      path.endsWith('$json') ||
      path.endsWith('$edit') ||
      path.endsWith('$translate') ||
      path.endsWith('%24history') ||
      path.endsWith('%24edit') ||
      path.endsWith('%24translate') ||
      path.match('/users/github/login') ||
      path.match('/users/signin') ||
      (path.includes('/profiles/') && path.endsWith('/edit')) ||
      dir.endsWith('/profiles');
  };

  const redirectFilterFunc = (url, res) => {
    let uri = new URI(url).search(''), host = uri.host();
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
  };
  const linkRedirectFunc = (url, elem, html) => {
    if (url && url.trim) {
      url = url.trim();
    }
    let u = new URI(url), host, needToRebuildUrl = false;
    if ((host = u.host()) && host !== 'developer.mozilla.org') {
      if (host === 'mdn.mozillademos.org') {
        // should be automatically redirected back
        u = u.host('developer.mozilla.org');
        needToRebuildUrl = true;
      } else if (host === 'wiki.developer.mozilla.org') {
        u = u.host('developer.mozilla.org');
        needToRebuildUrl = true;
      } else {
        return url;
      }
    }
    if (u.is('relative')) {
      if (url[0] !== '/') {
        const pathArr1 = url.split('/');
        if (redirectLocale[pathArr1[0]] || localesMap[pathArr1[1]]) {
          pathArr1[0] = locale;
          u = new URI('/' + pathArr1.join('/'));
        }
      }
      u = u
        .removeSearch('redirectlocale', 'redirectslug', 'tag', 'language', 'raw', 'section', 'size')
        .search('')
        .absoluteTo(html.url)
        .normalizePath();
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
    if (url.match('en-US')) {
      // eslint-disable-next-line no-console
      errorLogger.warn(url, pathArr);
    }
    if (hardCodedRedirectUrl[url]) {
      return hardCodedRedirectUrl[url];
    }
    return url;
  };
  /** @type {RequestRedirectFunc} */
  const requestRedirectFunc = (url, res) => {
    let uri, path;
    if (res && (uri = new URI(url)) &&
      uri.host() === 'developer.mozilla.org' &&
      (path = uri.path())) {
      if (path.includes('/docs/') &&
        path.includes('$samples/') &&
        uri.search().includes('revision=')) {
        // probably example iframe
        return uri.search('').host('mdn.mozillademos.org').toString();
      }
      if (path.startsWith('/files/') && path.match(/^\/files\/\d+\//i)) {
        // static files
        return uri.search('').host('mdn.mozillademos.org').toString();
      }
    }
    return url;
  };
  if (!options.req) {
    options.req = {};
  }
  if (!options.req.hooks) {
    options.req.hooks = {};
  }
  if (!options.req.hooks.beforeRedirect) {
    options.req.hooks.beforeRedirect = [];
  }
  options.req.hooks.beforeRedirect.push(function (options) {
    const {pathname} = options.url, pathArr = pathname.split('/');
    if (pathArr && redirectLocale[pathArr[1]]) {
      pathArr[1] = locale;
      options.url.pathname = pathArr.join('/');
    }
    options.url.search = '';
  });
  const d = new Downloader(Object.assign({
    depth: 8,
    req: {
      headers: {
        'accept-language': locale
      },
    },
    localRoot,
    beginUrl: [
      `https://developer.mozilla.org/${locale}/docs/Web/API`,
      `https://developer.mozilla.org/${locale}/docs/Web/CSS/Reference`,
      `https://developer.mozilla.org/${locale}/docs/Web/JavaScript/Index`,
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
      `https://developer.mozilla.org/sitemaps/${locale}/sitemap.xml`,
      'https://developer.mozilla.org/sitemaps/en-US/sitemap.xml'
    ],
    detectLinkType,
    redirectFilterFunc,
    dropResourceFunc,
    preProcessHtml,
    postProcessHtml,
    linkRedirectFunc,
    skipProcessFunc,
    requestRedirectFunc
  }, options));

  cookieJar.setCookie(
    'django_language=' + locale,
    'https://developer.mozilla.org',
    () => d.start());

  return d;
};

module.exports = downloadMdn;
module.exports.processPathWithMultipleLocale = processPathWithMultipleLocale;