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
  'en-US': 1,
  'zh': 1,
  'Zh': 1,
  'Ja': 1,
  'ja': 1,
  'cn': 1,
  'us': 1,
  'zh-cn': 1,
  'xh-CN': 1,
  'zh_tw': 1,
  'en-us': 1,
  'Zh-cn': 1,
  'zh_CN': 1,
  'ga-IE': 1
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
  // 顶部登录
  $('#toolbox').remove();
  // 顶部语言、编辑、历史记录
  $('.document-actions').remove();
  // 顶部搜索
  $('#nav-main-search').remove();
  // 此页面上有脚本错误。虽然这条信息是写给网站编辑的，但您也可以在下面查看部分内容。
  $('#kserrors').remove();
  // head 中可选替代语言
  $('link[rel="alternate"]').remove();
  $('a[href$="$translate"]').remove();
  $('a[href$="$edit"]').remove();
  // 新闻脚本
  $('script[src*="newsletter"]').remove();
  $('script[src*="speedcurve.com"]').remove();
  // google-analytics
  $('script').each((index, elem) => {
    let text;
    elem = $(elem);
    if ((text = elem.html()) && text.includes('google-analytics')) {
      elem.remove();
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

const downloadMdn = (localRoot, locale = 'zh-CN', options = {}) => {
  if (!localesMap[locale]) {
    throw new TypeError('locale not exists');
  }

  const testLocaleRegExp =
    new RegExp(`/(${localeArr.filter(l => l !== locale).join('|')})/`, 'i');
  const localeLowerCase = locale.toLocaleLowerCase();

  const dropResourceFunc = (res) => {
    // const url = res.uri.toString();
    // if (!ret) {
    //   // eslint-disable-next-line no-console
    //   console.debug(res.uri.host(), res.uri.toString());
    // }
    const dir = res.uri.directory(), path = res.uri.path();
    return res.uri.host() !== 'developer.mozilla.org' ||
      testLocaleRegExp.test(path) ||
      path.endsWith('$history') ||
      path.endsWith('$edit') ||
      path.endsWith('$translate') ||
      path.endsWith('%24history') ||
      path.endsWith('%24edit') ||
      path.endsWith('%24translate') ||
      path.match('/users/github/login') || path.match('/users/signin') ||
      dir.endsWith('/profiles');
  };

  const linkRedirectFunc = (url) => {
    const u = new URI(url);
    const dirs = u.directory()
      .replace('en-\n\nUS', 'en-US')
      .split('/');
    let needToRebuildPath = false;
    if (!dirs || !dirs[1]) {
      return url;
    }
    if (redirectLocale[dirs[1]]) {
      dirs[1] = locale;
      needToRebuildPath = true;
    }
    if (appendLocalePath[dirs[1]]) {
      dirs.splice(1, 0, 'zh-CN');
      needToRebuildPath = true;
    }
    if (dirs[1] === 'DOM') {
      dirs.splice(1, 1, 'zh-CN', 'docs', 'Web', 'API');
      needToRebuildPath = true;
    } else if (dirs[1] === 'zh-CNdocs') {
      dirs.splice(1, 1, 'zh-CN', 'docs');
      needToRebuildPath = true;
    }
    if (typeof dirs[1] === 'string' && localeLowerCase === dirs[1].toLocaleLowerCase()) {
      if (appendDocsWebPath[dirs[2]]) {
        dirs.splice(2, 0, 'docs', 'Web');
        needToRebuildPath = true;
      } else if (appendDocsPath[dirs[2]]) {
        dirs.splice(2, 0, 'docs');
        needToRebuildPath = true;
      }
    }
    if (needToRebuildPath) {
      url = u.directory(dirs.join('/')).toString();
    }
    if (url.match('en-US')) {
      // eslint-disable-next-line no-console
      console.warn(url, u, dirs);
    }
    return url;
  };

  const d = new Downloader(Object.assign({
    depth: 5,
    localRoot,
    beginUrl: `https://developer.mozilla.org/${locale}/docs/Web`,
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