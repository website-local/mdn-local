const Downloader = require('./downloader');
const URI = require('urijs');
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
  'Cn': 1
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
  'jpeg': 1,
  'js': 1,
  'jsm': 1,
  'json': 1,
  'jar': 1,
  'png': 1,
  'svg': 1,
  'txt': 1,
  'woff2': 1,
  'xul': 1,
  'zip': 1
};

// hard coded redirect url map to avoid the max-redirect things
const hardCodedRedirectUrl = require('./redirect-url');

/**
 *
 * @param {CheerioStatic} $
 * @return {CheerioStatic}
 */
const preProcessHtml = ($) => {
  // 顶部提示
  $('.global-notice').remove();
  // 页脚
  $('#nav-footer').remove();
  // 新闻盒子
  $('.newsletter-box').remove();
  $('.newsletter-container').remove();
  // 顶部登录
  $('#toolbox').remove();
  // 顶部语言、编辑、历史记录
  $('.document-actions').remove();
  $('.dropdown-container').remove();
  // 顶部搜索
  $('#nav-main-search').remove();
  $('.header-search').remove();
  $('.contributors-sub').remove();
  // 此页面上有脚本错误。虽然这条信息是写给网站编辑的，但您也可以在下面查看部分内容。
  $('#kserrors').remove();
  // head 中可选替代语言
  $('link[rel="alternate"]').remove();
  $('a[href$="$translate"]').remove();
  $('a[href$="$edit"]').remove();
  // no script mode ?
  // $('script').remove();
  // 新闻脚本
  $('script[src*="newsletter"]').remove();
  $('script[src*="speedcurve.com"]').remove();
  // google-analytics
  $('script').each((index, elem) => {
    let text;
    elem = $(elem);
    if ((text = elem.html())) {
      if (text.includes('google-analytics')) elem.remove();
      // if (text.includes('window._react_data')) {
      //   elem.html('window._react_data = {}');
      // }
    }
  });
  // 加入社区盒子
  $('.communitybox').remove();
  // 底部弹出
  $('#contribution-popover-container').remove();
  // 正在翻译
  $('.overheadIndicator.translationInProgress').remove();
  // 我们的志愿者还没有将这篇文章翻译
  $('#doc-pending-fallback').remove();
  // TODO: 处理iframe
  $('iframe').remove();
  return $;
};
/**
 *
 * @param {string} url
 * @param {Cheerio} element
 */
const skipProcessFunc = (url, element) => {
  return url.startsWith('#') || element.is('a.external-icon') || element.hasClass('external');
};

/**
 *
 * @param {string} url
 * @param {Cheerio} elem
 */
const detectLinkType = (url, elem) => {
  if (elem.is('a') || elem.is('iframe')) {
    const paths = url.split('/');
    let arr;
    if (paths && paths.length &&
      (arr = paths[paths.length - 1].split('.')) && arr.length > 1) {
      if (!validExtensionName[arr[arr.length - 1].toLowerCase()]) {
        return 'html';
      }
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
      return ;
    }
    return host !== 'developer.mozilla.org' ||
      testLocaleRegExp.test(path) ||
      path.startsWith('/search') ||
      path.startsWith('search') ||
      path.endsWith('$history') ||
      path.endsWith('$edit') ||
      path.endsWith('$translate') ||
      path.endsWith('%24history') ||
      path.endsWith('%24edit') ||
      path.endsWith('%24translate') ||
      path.match('/users/github/login') || path.match('/users/signin') ||
      dir.endsWith('/profiles');
  };

  const linkRedirectFunc = (url, elem, html) => {
    let u = new URI(url), host;
    if ((host = u.host()) && host !== 'developer.mozilla.org') {
      return url;
    }
    if (u.is('relative')) {
      u = u.absoluteTo(html.url);
    }
    const pathArr = u.path()
      .replace('en-\n\nUS', 'en-US')
      .split('/');
    let needToRebuildPath = false;
    if (!pathArr || !pathArr[1]) {
      return url;
    }
    if (u.protocol() === 'http') {
      u.protocol('https');
      needToRebuildPath = true;
    }
    if (processPathWithMultipleLocale(pathArr, locale)) {
      needToRebuildPath = true;
    }
    if (redirectLocale[pathArr[1]] || localesMap[pathArr[1]]) {
      pathArr[1] = locale;
      needToRebuildPath = true;
    }
    if (appendLocalePath[pathArr[1]]) {
      pathArr.splice(1, 0, locale);
      needToRebuildPath = true;
    }
    if (pathArr[1] === 'DOM') {
      pathArr.splice(1, 1, locale, 'docs', 'Web', 'API');
      needToRebuildPath = true;
    } else if (pathArr[1] === 'zh-CNdocs') {
      pathArr.splice(1, 1, locale, 'docs');
      needToRebuildPath = true;
    }
    if (typeof pathArr[1] === 'string' && localeLowerCase === pathArr[1].toLocaleLowerCase()) {
      if (appendDocsWebPath[pathArr[2]]) {
        pathArr.splice(2, 0, 'docs', 'Web');
        needToRebuildPath = true;
      } else if (appendDocsPath[pathArr[2]]) {
        pathArr.splice(2, 0, 'docs');
        needToRebuildPath = true;
      }
    }
    if (needToRebuildPath) {
      url = u.path(pathArr.join('/')).toString();
    }
    if (url.match('en-US')) {
      // eslint-disable-next-line no-console
      console.warn(url, u, pathArr);
    }
    if (hardCodedRedirectUrl[url]) {
      return hardCodedRedirectUrl[url];
    }
    return url;
  };

  const d = new Downloader(Object.assign({
    depth: 5,
    req: {
      headers: {
        'accept-language': locale
      },
    },
    localRoot,
    beginUrl: [
      `https://developer.mozilla.org/${locale}/docs/Web/API`,
      `https://developer.mozilla.org/${locale}/docs/Web/CSS/Reference`,
      `https://developer.mozilla.org/${locale}/docs/Web/HTTP`,
      `https://developer.mozilla.org/${locale}/docs/Web/JavaScript/Index`,
      `https://developer.mozilla.org/${locale}/docs/Web/HTML/Attributes`,
      `https://developer.mozilla.org/${locale}/docs/Web/HTML/Element`,
      `https://developer.mozilla.org/${locale}/docs/Web`
    ],
    detectLinkType,
    dropResourceFunc,
    preProcessHtml,
    linkRedirectFunc,
    skipProcessFunc
  }, options));
  d.start();

  return d;
};

module.exports = downloadMdn;
module.exports.processPathWithMultipleLocale = processPathWithMultipleLocale;