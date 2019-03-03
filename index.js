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
  return element.is('a.external-icon');
};

const downloadMdn = (localRoot, locale = 'zh-CN', options = {}) => {
  if (!localesMap[locale]) {
    throw new TypeError('locale not exists');
  }

  const testLocaleRegExp =
    new RegExp(`/(${localeArr.filter(l => l !== locale).join('|')})/`);

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
    }
    if (url.match('en-US')) {
      // eslint-disable-next-line no-console
      console.warn(url, u, dirs);
    }
    return url;
  };

  const d = new Downloader(Object.assign({
    depth: 3,
    localRoot,
    beginUrl: `https://developer.mozilla.org/${locale}/docs/Web`,
    dropResourceFunc,
    preProcessHtml,
    linkRedirectFunc,
    skipProcessFunc
  }, options));
  d.start();

  return d;
};

module.exports = downloadMdn;