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

const preProcessHtml = ($) => {
  $('.global-notice').remove();
  $('#nav-footer').remove();
  $('.newsletter-box').remove();
  $('#toolbox').remove();
  $('.document-actions').remove();
  $('#nav-main-search').remove();
  $('link[rel="alternate"]').remove();
  $('script[src*="newsletter"]').remove();
  return $;
};

const downloadMdn = (localRoot, locale = 'zh-CN') => {
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

  const d = new Downloader({
    depth: 1,
    localRoot,
    beginUrl: `https://developer.mozilla.org/${locale}/docs/Web`,
    dropResourceFunc,
    preProcessHtml,
    linkRedirectFunc
  });
  d.start();

  return d;
};

module.exports = downloadMdn;