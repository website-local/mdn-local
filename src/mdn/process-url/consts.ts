import {arrayToMap} from 'website-scrap-engine/lib/util.js';

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
  // https://github.com/website-local/mdn-local/issues/929
  // 20231003
  'upload.wikimedia.org',
  'cdn.aframe.io',
  'raw.githubusercontent.com',
  // https://github.com/website-local/mdn-local/issues/930
  // 20231003
  'archive.org',
  'peach.blender.org',
  // 20240503
  'download.g63.ru',
  'www.whatwg.org',
  // 20250203
  'mdn.dev',
  'resources.whatwg.org',
  'pixabay.com',
  'c1.staticflickr.com',
]);

export interface ExternalHost {
  protocol: string;
  host: string;
  prefix: string;
  pathPrefix: string;
  pathPrefixLength: number;
  pattern: string;
}

export const externalHosts = [
  ['/interactive-examples/', 'interactive-examples.mdn.mozilla.net'],
  ['/mdn-github-io/', 'mdn.github.io'],
  ['/unpkg-com/', 'unpkg.com'],
  ['/mdn-github-io/', 'mdn.github.io'],
  // https://github.com/website-local/mdn-local/issues/361
  ['/cdnjs-cloudflare-com/', 'cdnjs.cloudflare.com'],
  // https://github.com/website-local/mdn-local/issues/448
  ['/cdn-jsdelivr-net/', 'cdn.jsdelivr.net'],
  // https://github.com/website-local/mdn-local/issues/929
  // 20231003
  ['/upload.wikimedia.org/', 'upload.wikimedia.org'],
  ['/cdn.aframe.io/', 'cdn.aframe.io'],
  ['/raw.githubusercontent.com/', 'raw.githubusercontent.com'],
  // https://github.com/website-local/mdn-local/issues/930
  // 20231003
  ['/archive.org/', 'archive.org'],
  ['/peach.blender.org/', 'peach.blender.org'],
  // 20240503
  ['/download.g63.ru/', 'download.g63.ru', 'http'],
  ['/www.whatwg.org/', 'www.whatwg.org'],
  // 20250203
  ['/mdn.dev/', 'mdn.dev'],
  ['/resources.whatwg.org/', 'resources.whatwg.org'],
  // 20250323
  ['/mdnplay.dev/', 'mdnplay.dev'],
  // 20250503
  // having no idea why they like external images so much
  ['/pixabay.com/', 'pixabay.com'],
  ['/c1.staticflickr.com/', 'c1.staticflickr.com'],
  ['/wikipedia.org/', 'wikipedia.org'],
  ['/images.unsplash.com/', 'images.unsplash.com'],
  ['/www.mozilla.org/', 'www.mozilla.org'],
].map(([prefix, host, protocol]) => ({
  protocol: protocol || 'https',
  host,
  prefix,
  pathPrefix: prefix.slice(0, -1),
  pathPrefixLength: prefix.length - 1,
  pattern: '//' + host + '/',
} as ExternalHost));

export const externalHostMap: Record<string, ExternalHost> = {};

for (const externalHost of externalHosts) {
  externalHostMap[externalHost.host] = externalHost;
}
