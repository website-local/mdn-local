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
  'en-US': 1
};

const appendLocalePath = {
  'docs': 1
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
  'nsIXMLHttpRequest': 1
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
  // head 中可选替代语言
  $('link[rel="alternate"]').remove();
  // 新闻脚本
  $('script[src*="newsletter"]').remove();
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
    if (paths && !paths[paths.length - 1].includes('.')) {
      return 'html';
    }
  }
};

const downloadMdn = (localRoot, locale = 'zh-CN', options = {}) => {
  if (!localesMap[locale]) {
    throw new TypeError('locale not exists');
  }

  const testLocaleRegExp =
    new RegExp(`/(${localeArr.filter(l => l !== locale).join('|')})/`);
  const localeLowerCase = locale.toLocaleLowerCase();

  const dropResourceFunc = (res) => {
    // const url = res.uri.toString();
    // if (!ret) {
    //   // eslint-disable-next-line no-console
    //   console.debug(res.uri.host(), res.uri.toString());
    // }
    const dir = res.uri.directory(), path = res.uri.path();
    return res.uri.host() !== 'developer.mozilla.org' ||
      testLocaleRegExp.test(path) || path.endsWith('$history') ||
      path.match('/users/github/login') || path.match('/users/signin') ||
      dir.endsWith('/profiles');
  };

  const linkRedirectFunc = (url) => {
    const u = new URI(url);
    const dirs = u.directory().split('/');
    if (!dirs || !dirs[1]) {
      return url;
    }
    if (redirectLocale[dirs[1]]) {
      dirs[1] = locale;
      return u.directory(dirs.join('/')).toString();
    } else if (appendLocalePath[dirs[1]]) {
      dirs.splice(1, 0, 'zh-CN');
      return u.directory(dirs.join('/')).toString();
    } else if (typeof dirs[1] === 'string' && localeLowerCase === dirs[1].toLocaleLowerCase()) {
      if (appendDocsWebPath[dirs[2]]) {
        dirs.splice(2, 0, 'docs', 'Web');
        return u.directory(dirs.join('/')).toString();
      } else if (appendDocsPath[dirs[2]]) {
        dirs.splice(2, 0, 'docs');
        return u.directory(dirs.join('/')).toString();
      }
    }
    if (url.match('en-US')) {
      // eslint-disable-next-line no-console
      console.warn(url, u, dirs);
    }
    return url;
  };

  const d = new Downloader(Object.assign({
    depth: 4,
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