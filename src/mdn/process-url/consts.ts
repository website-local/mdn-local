import { arrayToMap } from 'website-scrap-engine/lib/util';

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
  'developer.allizom.org'
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
  'mdn.github.io'
]);

// manually collected
export const largeMp4Videos = arrayToMap([
  '/learning-area/javascript/apis/video-audio/finished/video/sintel-short.mp4',
  '/html-examples/link-rel-preload/video/sintel-short.mp4',
  '/imsc/videos/coffee.mp4',
  '/imsc/videos/stars.mp4',
  '/dom-examples/fullscreen-api/assets/bigbuckbunny.mp4',
  '/dom-examples/picture-in-picture/assets/bigbuckbunny.mp4'
]);

// manually collected
export const largeWebmVideos = arrayToMap([
  '/learning-area/javascript/apis/video-audio/finished/video/sintel-short.webm',
  '/html-examples/link-rel-preload/video/sintel-short.webm'
]);
