const log4js = require('log4js');
const JSON5 = require('json5');
const errorLogger = log4js.getLogger('error');

const TO_REMOVE_CLASS = 'to-remove-elem';
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

const postProcessMdnAssets = (text, $, elem) => {
  let assetsData, assetsBody;
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
  return text;
};

const JSON_PARSE_STR = 'JSON.parse(';
// place holders
const PLACE_HOLDER_BODY_HTML = '@#%PLACE_HOLDER_BODY_HTML%#@';
const PLACE_HOLDER_QUICK_HTML = '@#!PLACE_HOLDER_QUICK_HTML!#@';
const PLACE_HOLDER_TOC_HTML = '@#!%PLACE_HOLDER_TOC_HTML!#%@';
const PLACE_HOLDER_SUMMARY_HTML = '@#!%$PLACE_HOLDER_SUMMARY_HTML!$#%@';
// language=JavaScript
const MOCK_FETCH_JS = `
  // mock fetch to avoid script errors
  window.fetch = function () {
    return Promise.resolve({
      json: function () {
        return Promise.resolve({
          is_superuser: true,
          waffle: {flags: {}, samples: {}, switches: {registration_disabled: true}}
        });
      }
    });
  };
`;
const postProcessReactData = (text, elem) => {
  let jsonStrBeginIndex = text.indexOf(JSON_PARSE_STR),
    jsonStrEndIndex, escapedJsonText, jsonText, data, stringCatalog, key;
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
  if (data.documentData) {
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
    if (data.documentData.summary) {
      data.documentData.summary = PLACE_HOLDER_SUMMARY_HTML;
    }
    if (data.documentData.raw) {
      // not needed in pages
      data.documentData.raw = '';
    }
    // remove the generated translate sign
    if (data.documentData.translateURL) {
      data.documentData.translateURL = '';
    }
    if (data.locale && data.documentData.locale) {
      data.documentData.locale = data.locale;
    }
  }
  if ((stringCatalog = data.stringCatalog)) {
    for (key in stringCatalog) {
      // noinspection JSUnfilteredForInLoop
      if (key.includes('<') ||
        // Invalid or unexpected token
        key.includes('>') ||
        // useless items for local version
        key.startsWith('Our goal is to provide accurate') ||
        key.startsWith('Publishing failed.') ||
        key.startsWith('Would you answer 4 questions for us') ||
        key.startsWith('I’m okay with Mozilla') ||
        key.startsWith('A newer version of this article') ||
        key.startsWith('Our team will review your report.')) {
        // noinspection JSUnfilteredForInLoop
        delete stringCatalog[key];
      }
    }
  }
  // language=JavaScript
  text = `
!function() {
  var _mdn_local_quickLinks = document.querySelector('.quick-links ol'),
  _mdn_local_body = document.getElementById('wikiArticle'),
  _mdn_local_toc = document.querySelector('.document-toc ul'),
  _mdn_local_summary = document.querySelector('#wikiArticle>p');
  // replace _react_data to reduce size
  window._react_data = ${JSON.stringify(data)
    .replace(`"${PLACE_HOLDER_QUICK_HTML}"`,
      '_mdn_local_quickLinks && _mdn_local_quickLinks.outerHTML')
    .replace(`"${PLACE_HOLDER_BODY_HTML}"`,
      '_mdn_local_body && _mdn_local_body.innerHTML')
    .replace(`"${PLACE_HOLDER_SUMMARY_HTML}"`,
      '_mdn_local_summary && _mdn_local_summary.innerHTML')
    .replace(`"${PLACE_HOLDER_TOC_HTML}"`,
      '_mdn_local_toc && _mdn_local_toc.innerHTML')};
${MOCK_FETCH_JS}
}();
  `.trim();
  elem.html(text);
};

const JS_POLYFILL_CLASS = 'js-polyfill-temp-script';
const SCRIPT_PREFIX = '<script src="';
const postProcessJsPolyFill = ($, elem, text) => {
  let beginIndex = text.indexOf(SCRIPT_PREFIX), tempScript, endIndex, src;
  if (beginIndex < 1) return elem.remove();
  beginIndex += SCRIPT_PREFIX.length;
  endIndex = text.indexOf('"', beginIndex);
  if (endIndex < 1) return elem.remove();
  tempScript = $('.' + JS_POLYFILL_CLASS);
  if (!tempScript || !tempScript.length) return elem.remove();
  src = tempScript.attr('src');
  tempScript.remove();
  elem.html(text.slice(0, beginIndex) + src + text.slice(endIndex));
};

const postProcessHtml = ($) => {
  $('script').each((index, elem) => {
    let text;
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
.signin-link{ display:none }
</style>`).appendTo('head');
      return;
    }
    if (text.includes('document.write') && text.includes('js-polyfill')) {
      return postProcessJsPolyFill($, elem, text);
    }
    postProcessMdnAssets(text, $, elem);
  });
  return $;
};

const preProcessMdnAssets = ($, text, assetsData) => {

  let head, keys, len, i, key, values, valueLen, j;
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
};

const preProcessJsPolyFill = ($, text) => {
  let beginIndex = text.indexOf(SCRIPT_PREFIX), endIndex, src;
  if (beginIndex < 1) return;
  beginIndex += SCRIPT_PREFIX.length;
  endIndex = text.indexOf('"', beginIndex);
  if (endIndex < 1) return;
  src = text.slice(beginIndex, endIndex);
  $('head').append(`<script class="${JS_POLYFILL_CLASS}" src="${src}">`);
};

const preProcessHtml = ($) => {
  $('bdi').parent().parent().remove();
  $('.bc-github-link').remove();
  $('.hidden').remove();
  $('meta[name^="twitter"]').remove();
  $('meta[name^="og"]').remove();
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
  $('link[rel="apple-touch-icon-precomposed"]').remove();
  $('a[href$="$translate"]').remove();
  $('a[href$="$edit"]').remove();
  // no script mode ?
  // $('script').remove();
  // 新闻脚本
  $('script[src*="newsletter"]').remove();
  // bcd-signal script, not needed for offline usage
  $('script[src*="react-bcd-signal"]').remove();
  $('script[src*="speedcurve.com"]').remove();
  let assetsData, text;

  $('script').each((index, elem) => {
    elem = $(elem);
    if ((text = elem.html())) {
      // google-analytics
      if (text.includes('google-analytics') ||
        text.includes('mdn.analytics.trackOutboundLinks') ||
        text.includes('LUX=') ||
        // fetch polyfill not needed since it's mocked.
        text.includes('fetch-polyfill')) {
        return elem.remove();
      }

      if ((assetsData = extractMdnAssets(text)) &&
        ({assetsData} = assetsData) && assetsData) {
        return preProcessMdnAssets($, text, assetsData);
      }
      if (text.includes('document.write') && text.includes('js-polyfill')) {
        preProcessJsPolyFill($, text);
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

module.exports = {preProcessHtml, postProcessHtml};