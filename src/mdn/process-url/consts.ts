import {arrayToMap} from 'website-scrap-engine/lib/util';

export const localeArr = [
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
export const localesMap = arrayToMap(localeArr);

export const redirectLocale = arrayToMap([
  'en', 'En', 'EN', 'en-US', 'en_US', 'us', 'en-us',
  'zh', 'Zh', 'cn', 'Cn',
  'zh-cn', 'xh-CN', 'Zh-cn', 'zh_CN', 'zh-US', 'zh-Hans', 'ch-ZN', 'zh_tw',
  'Ja', 'ja', 'ig', 'ga-IE', 'zu',
  'yo', 'xh', 'wo', 'tn', 'sw', 'son', 'mg',
  'ln', 'ha', 'ff', 'ee', 'bn', 'pt', 'pt-PT', 'tr', 'Tr'
]);

export const appendLocalePath = arrayToMap(['docs', 'Web']);

export const appendDocsWebPath = arrayToMap([
  'JavaScript', 'API', 'CSS', 'HTML',
  'Guide', 'MathML',
  'Accessibility', 'XPath'
]);

export const appendDocsPath = arrayToMap([
  'Web',
  'Mozilla',
  'Core_JavaScript_1.5_Reference',
  'nsIXMLHttpRequest',
  'Learn'
]);

export const mdnHosts = arrayToMap([
  'developer.mozilla.org',
  // https://github.com/myfreeer/mdn-local/issues/44
  'mdn.mozillademos.org',
  'wiki.developer.mozilla.org',
  'developer.cdn.mozilla.net',
  'developer.allizom.org',
  // https://github.com/website-local/mdn-local/issues/208
  'developer-stage.mdn.mozit.cloud',
  'developer-prod.mdn.mozit.cloud'
]);

export const downloadableHosts = arrayToMap([
  'developer.mozilla.org',
  // https://github.com/myfreeer/mdn-local/issues/44
  'mdn.mozillademos.org',
  'interactive-examples.mdn.mozilla.net',
  'wiki.developer.mozilla.org',
  'developer.cdn.mozilla.net',
  'developer.allizom.org',
  'unpkg.com',
  'mdn.github.io',
  // https://github.com/website-local/mdn-local/issues/361
  'cdnjs.cloudflare.com',
  // https://github.com/website-local/mdn-local/issues/448
  'cdn.jsdelivr.net',
  // https://github.com/website-local/mdn-local/issues/208
  'developer-stage.mdn.mozit.cloud',
  'developer-prod.mdn.mozit.cloud',
  // https://github.com/website-local/mdn-local/issues/890
  'bcd.developer.mozilla.org',
  'bcd.developer.allizom.org',
]);
