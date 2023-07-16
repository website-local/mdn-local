import {
  defaultInitialUrl
} from '../../../src/mdn/process-url/default-initial-url';

describe('default-initial-url', function () {
  // related
  // https://github.com/myfreeer/mdn-local/issues/6
  // 895b88350651dde02e6112438be5db2c14c2bd5e
  // 0bb6f570eca90c8e21c8f044cf66334a863aa856
  test('en-US', () => {
    expect(defaultInitialUrl('en-US')).toStrictEqual([
      'https://developer.mozilla.org/en-US/docs/Web/API',
      'https://developer.mozilla.org/en-US/docs/Web/CSS/Reference',
      'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
      'https://developer.mozilla.org/en-US/docs/Web/HTML/Index',
      'https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes',
      'https://developer.mozilla.org/en-US/docs/Web/HTML/Element',
      'https://developer.mozilla.org/en-US/docs/Web/HTTP',
      'https://developer.mozilla.org/en-US/docs/Web/Tutorials',
      'https://developer.mozilla.org/en-US/docs/Web/Guide',
      'https://developer.mozilla.org/en-US/docs/Web/Accessibility',
      'https://developer.mozilla.org/en-US/docs/Web/Reference',
      'https://developer.mozilla.org/en-US/docs/Web/Web_components',
      'https://developer.mozilla.org/en-US/docs/Web/MathML',
      'https://developer.mozilla.org/en-US/docs/Web',
      'https://developer.mozilla.org/en-US/docs/Mozilla',
      'https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions',
      'https://developer.mozilla.org/en-US/docs/Learn',
      'https://developer.mozilla.org/en-US/docs/Games',
      'https://developer.mozilla.org/en-US/docs/Glossary',
      // https://github.com/website-local/mdn-local/issues/214
      'https://developer.mozilla.org/sitemaps/en-us/sitemap.xml.gz',
      // https://github.com/website-local/mdn-local/issues/372
      'https://developer.mozilla.org/en-US/search-index.json',
    ]);
  });
  test('non-en-US', () => {
    expect(defaultInitialUrl('zh-CN')).toStrictEqual([
      'https://developer.mozilla.org/zh-CN/docs/Web/API',
      'https://developer.mozilla.org/zh-CN/docs/Web/CSS/Reference',
      'https://developer.mozilla.org/zh-CN/docs/Web/JavaScript',
      'https://developer.mozilla.org/zh-CN/docs/Web/HTML/Index',
      'https://developer.mozilla.org/zh-CN/docs/Web/HTML/Attributes',
      'https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element',
      'https://developer.mozilla.org/zh-CN/docs/Web/HTTP',
      'https://developer.mozilla.org/zh-CN/docs/Web/Tutorials',
      'https://developer.mozilla.org/zh-CN/docs/Web/Guide',
      'https://developer.mozilla.org/zh-CN/docs/Web/Accessibility',
      'https://developer.mozilla.org/zh-CN/docs/Web/Reference',
      'https://developer.mozilla.org/zh-CN/docs/Web/Web_components',
      'https://developer.mozilla.org/zh-CN/docs/Web/MathML',
      'https://developer.mozilla.org/zh-CN/docs/Web',
      'https://developer.mozilla.org/zh-CN/docs/Mozilla',
      'https://developer.mozilla.org/zh-CN/docs/Mozilla/Add-ons/WebExtensions',
      'https://developer.mozilla.org/zh-CN/docs/Learn',
      'https://developer.mozilla.org/zh-CN/docs/Games',
      'https://developer.mozilla.org/zh-CN/docs/Glossary',
      // https://github.com/website-local/mdn-local/issues/214
      'https://developer.mozilla.org/sitemaps/zh-cn/sitemap.xml.gz',
      'https://developer.mozilla.org/zh-CN/search-index.json',
      // https://github.com/website-local/mdn-local/issues/372
      'https://developer.mozilla.org/sitemaps/en-us/sitemap.xml.gz',
    ]);
  });
});
