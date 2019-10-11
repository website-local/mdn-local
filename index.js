const Downloader = require('./downloader');
const URI = require('urijs');
const log4js = require('log4js');
const path = require('path');
const JSON5 = require('json5');
const errorLogger = log4js.getLogger('error');

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
  'zip': 1,
  'mp4': 1,
  'flv': 1,
  'm4v': 1,
  'mkv': 1
};

const TO_REMOVE_CLASS = 'to-remove-elem';

// hard coded redirect url map to avoid the max-redirect things
const hardCodedRedirectUrl = require('./redirect-url');

const extractMdnAssets = (text) => {

  let assetsBaseIndex, assetsBeginIndex, assetsEndIndex, assetsData;

  if ((assetsBaseIndex = text.indexOf('mdn.assets')) > 0 &&
    (assetsBeginIndex = text.indexOf('=', assetsBaseIndex)) > 0 &&
    (assetsEndIndex = text.indexOf(';', assetsBeginIndex)) > 0) {
    try {
      assetsData = JSON5.parse(text.slice(++assetsBeginIndex, assetsEndIndex));
    } catch (e) {
      errorLogger.warn('extractMdnAssets fail', e);
    }
  }
  if (!assetsData) {
    return;
  }
  return {
    assetsData,
    assetsBeginIndex,
    assetsEndIndex
  };
};

const JSON_PARSE_STR = 'JSON.parse(';
const PLACE_HOLDER_BODY_HTML = '@#%PLACE_HOLDER_BODY_HTML%#@';
const PLACE_HOLDER_QUICK_HTML = '@#!PLACE_HOLDER_QUICK_HTML!#@';
const PLACE_HOLDER_TOC_HTML = '@#!%PLACE_HOLDER_TOC_HTML!#%@';

// language=JavaScript
const MOCK_FETCH_JS = `
// mock fetch to avoid script errors
window.fetch = () => Promise.resolve({json:()=>Promise.resolve({
  is_superuser:true,waffle:{flags:{},samples:{},switches:{registration_disabled:true}}})});
`;

const postProcessReactData = (text, elem) => {
  let jsonStrBeginIndex = text.indexOf(JSON_PARSE_STR),
    jsonStrEndIndex, escapedJsonText, jsonText, data;
  if (jsonStrBeginIndex < 1 ||
    jsonStrBeginIndex + JSON_PARSE_STR.length > text.length) {
    return;
  }
  jsonStrBeginIndex += JSON_PARSE_STR.length;
  if (!((jsonStrEndIndex = text.lastIndexOf('"')) > 0 &&
    ++jsonStrEndIndex < text.length &&
    (escapedJsonText = text.slice(jsonStrBeginIndex, jsonStrEndIndex)))) {
    return;
  }
  try {
    jsonText = JSON.parse(escapedJsonText);
    data = JSON.parse(jsonText);
  } catch (e) {
    errorLogger.warn('postProcessReactData: json parse fail', e);
  }
  if (!data) {
    return;
  }
  if (!data.documentData) {
    elem.html(MOCK_FETCH_JS + text);
    return;
  }
  data.documentData.translations = [];
  if (data.documentData.bodyHTML) {
    data.documentData.bodyHTML = PLACE_HOLDER_BODY_HTML;
  }
  if (data.documentData.quickLinksHTML) {
    data.documentData.quickLinksHTML = PLACE_HOLDER_QUICK_HTML;
  }
  if (data.documentData.tocHTML) {
    data.documentData.tocHTML = PLACE_HOLDER_TOC_HTML;
  }
  // language=JavaScript
  text = `
!function() {
  var _mdn_local_quickLinks = document.querySelector('.quick-links ol'),
  _mdn_local_body = document.getElementById('wikiArticle'),
  _mdn_local_toc = document.querySelector('.document-toc ul');
  // replace _react_data to reduce size
  window._react_data = ${JSON.stringify(data)
    .replace(`"${PLACE_HOLDER_QUICK_HTML}"`,
      '_mdn_local_quickLinks && _mdn_local_quickLinks.outerHTML')
    .replace(`"${PLACE_HOLDER_BODY_HTML}"`,
      '_mdn_local_body && _mdn_local_body.innerHTML')
    .replace(`"${PLACE_HOLDER_TOC_HTML}"`,
      '_mdn_local_toc && _mdn_local_toc.innerHTML')};
${MOCK_FETCH_JS}
}();
  `.trim();
  elem.html(text);
};

const postProcessHtml = ($) => {
  $('script').each((index, elem) => {
    let assetsData, text, assetsBody;
    elem = $(elem);
    if (!(text = elem.html())) {
      return;
    }
    if (text.includes('window._react_data')) {
      postProcessReactData(text, elem);
      // $('#react-container').removeAttr('id');
      // hide dynamically created useless stuff via css
      $(`<style>
#nav-footer,
.contributors-sub,
#nav-main-search,
.newsletter-container,
.dropdown-container,
.bc-data .bc-github-link,
.signin-link{ display:none }`).appendTo('head');
      return;
    }
    if (!((assetsData = extractMdnAssets(text)) &&
      assetsData.assetsBeginIndex > 0 &&
      assetsData.assetsEndIndex > assetsData.assetsBeginIndex)) {
      return;
    }
    assetsBody = {
      js: {},
      css: {}
    };
    $('.' + TO_REMOVE_CLASS).each((index, elem) => {
      let base, key, url;
      elem = $(elem);
      if (elem.is('script')) {
        base = assetsBody.js;
        url = elem.attr('src');
      } else if (elem.is('link')) {
        base = assetsBody.css;
        url = elem.attr('href');
      } else {
        return;
      }
      if (!(key = elem.attr('data-key'))) {
        return;
      }
      if (!base[key]) {
        base[key] = [];
      }
      base[key].push(url);
      elem.remove();
    });
    text = text.slice(0, assetsData.assetsBeginIndex) +
      JSON.stringify(assetsBody) +
      text.slice(assetsData.assetsEndIndex);
    elem.html(text);
  });
  return $;
};

const preProcessHtml = ($) => {
  $('bdi').parent().parent().remove();
  $('.bc-github-link').remove();
  $('.hidden').remove();
  $('meta[name^="twitter"]').remove();
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
  $('#edit-history-menu').remove();
  $('.header-search').remove();
  $('.contributors-sub').remove();
  // 此页面上有脚本错误。虽然这条信息是写给网站编辑的，但您也可以在下面查看部分内容。
  $('#kserrors').remove();
  // head 中可选替代语言
  $('link[rel="alternate"]').remove();
  $('link[rel="preconnect"]').remove();
  $('link[rel="canonical"]').remove();
  $('link[rel="search"]').remove();
  $('a[href$="$translate"]').remove();
  $('a[href$="$edit"]').remove();
  // no script mode ?
  // $('script').remove();
  // 新闻脚本
  $('script[src*="newsletter"]').remove();
  $('script[src*="speedcurve.com"]').remove();
  let assetsData;

  $('script').each((index, elem) => {
    let text, head, keys, len, i, key, values, valueLen, j;
    elem = $(elem);
    if ((text = elem.html())) {
      // google-analytics
      if (text.includes('google-analytics')) elem.remove();
      if (text.includes('mdn.analytics.trackOutboundLinks')) elem.remove();
      if ((assetsData = extractMdnAssets(text)) &&
        ({assetsData} = assetsData) && assetsData) {
        head = $('head');
        if (assetsData.js &&
          (keys = Object.keys(assetsData.js)) &&
          (len = keys.length)) {
          for (i = 0; i < len; i++) {
            if ((key = keys[i]) &&
              (values = assetsData.js[key]) &&
              (valueLen = values.length)) {
              for (j = 0; j < valueLen; j++) {
                $(`<script class="${TO_REMOVE_CLASS}" src="${values[j]}" defer data-key="${key}"></script>`)
                  .appendTo(head);
              }
            }
          }
        }
        if (assetsData.css &&
          (keys = Object.keys(assetsData.css)) &&
          (len = keys.length)) {
          for (i = 0; i < len; i++) {
            if ((key = keys[i]) &&
              (values = assetsData.css[key]) &&
              (valueLen = values.length)) {
              for (j = 0; j < valueLen; j++) {
                $(`<link class="${TO_REMOVE_CLASS}" rel="stylesheet" href="${values[j]}" data-key="${key}"/>`)
                  .appendTo(head);
              }
            }
          }
        }
      }
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
  // TODO: Tag pagination
  // https://github.com/myfreeer/mdn-local/issues/10
  $('.pagination').remove();
  // fix script
  $(`<div style="display:none" class="script-workaround">
<div id="close-header-search"></div>
<div id="nav-main-search"></div>
<div id="main-q"></div>
</div>`).appendTo('#main-header');
  return $;
};
/**
 *
 * @param {string} url
 * @param {Cheerio} element
 */
const skipProcessFunc = (url, element) => {
  return url.startsWith('#') || element.hasClass('external-icon') || element.hasClass('external');
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
  log4js.configure({
    appenders: {
      'retry': {
        type: 'file',
        filename: path.join(localRoot, 'developer.mozilla.org', 'logs', 'retry.log')
      },
      'mkdir': {
        type: 'file',
        filename: path.join(localRoot, 'developer.mozilla.org', 'logs', 'mkdir.log')
      },
      'error': {
        type: 'file',
        filename: path.join(localRoot, 'developer.mozilla.org', 'logs', 'error.log')
      },
      '404': {
        type: 'file',
        filename: path.join(localRoot, 'developer.mozilla.org', 'logs', '404.log')
      },
      'complete': {
        type: 'file',
        filename: path.join(localRoot, 'developer.mozilla.org', 'logs', 'complete.log')
      },
      'stdout': {
        type: 'stdout'
      },
      'stderr': {
        type: 'stderr'
      }
    },

    categories: {
      'retry': {
        appenders: ['stdout', 'retry'],
        level: 'debug'
      },
      'mkdir': {
        appenders: ['mkdir'],
        level: 'debug'
      },
      'error': {
        appenders: ['stderr', 'error'],
        level: 'debug'
      },
      '404-not-found': {
        appenders: ['404'],
        level: 'debug'
      },
      'complete': {
        appenders: ['complete'],
        level: 'debug'
      },
      'adjust-concurrency': {
        appenders: ['stdout', 'complete'],
        level: 'debug'
      },
      'default': {
        appenders: ['stdout', 'complete'],
        level: 'debug'
      }
    }
  });
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
      path.match('/users/github/login') || path.match('/users/signin') ||
      dir.endsWith('/profiles');
  };

  const redirectFilterFunc = (url, res) => {
    const uri = new URI(url), host = uri.host();
    if (host === 'mdn.mozillademos.org') {
      return uri.host('developer.mozilla.org').toString();
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
    let u = new URI(url), host, needToRebuildUrl = false;
    if ((host = u.host()) && host !== 'developer.mozilla.org') {
      if (host === 'mdn.mozillademos.org') {
        // should be automatically redirected back
        u.host('developer.mozilla.org');
        needToRebuildUrl = true;
      } else {
        return url;
      }
    }
    if (u.is('relative')) {
      u = u.absoluteTo(html.url);
    }
    const pathArr = u.path()
      .replace('en-\n\nUS', 'en-US')
      .split('/');
    if (!pathArr || !pathArr[1]) {
      return url;
    }
    if (u.protocol() === 'http') {
      u.protocol('https');
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
    const {path} = options, pathArr = path.split('/');
    if (pathArr && redirectLocale[pathArr[1]]) {
      pathArr[1] = locale;
      options.path = pathArr.join('/');
    }
  });
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
      `https://developer.mozilla.org/${locale}/docs/Mozilla/Add-ons/WebExtensions`,
      `https://developer.mozilla.org/${locale}/docs/Learn`,
      `https://developer.mozilla.org/${locale}/docs/Games`,
      `https://developer.mozilla.org/${locale}/docs/Glossary`
    ],
    detectLinkType,
    redirectFilterFunc,
    dropResourceFunc,
    preProcessHtml,
    postProcessHtml,
    linkRedirectFunc,
    skipProcessFunc
  }, options));
  d.start();

  return d;
};

module.exports = downloadMdn;
module.exports.processPathWithMultipleLocale = processPathWithMultipleLocale;