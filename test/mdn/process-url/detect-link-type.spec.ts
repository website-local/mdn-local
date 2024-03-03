import {detectLinkType} from '../../../src/mdn/process-url/detect-link-type';
import type {Resource} from 'website-scrap-engine/lib/resource';
import {ResourceType} from 'website-scrap-engine/lib/resource';
import cheerio from 'cheerio';
import URI = require('urijs');

describe('detect-link-type', function () {
  test('html', () => {
    const a = cheerio.load('<a></a>')('a');
    const iframe = cheerio.load('<a></a>')('a');
    expect(detectLinkType('https://developer.mozilla.org/zh-CN/docs/Web/API',
      ResourceType.Css, a, null)).toBe(ResourceType.Html);
    expect(detectLinkType('https://developer.mozilla.org/',
      ResourceType.Html, a, null)).toBe(ResourceType.Html);
    expect(detectLinkType('https://developer.mozilla.org/example.html',
      ResourceType.Binary, a, null)).toBe(ResourceType.Html);
    expect(detectLinkType('https://developer.mozilla.org/zh-CN/docs/Web/CSS/Reference',
      ResourceType.SiteMap, iframe, null)).toBe(ResourceType.Html);
    expect(detectLinkType('https://developer.mozilla.org/zh-CN/JavaScript_code_modules/Geometry.jsm',
      ResourceType.Binary, iframe, null)).toBe(ResourceType.Html);
    expect(detectLinkType('https://developer.mozilla.org/zh-CN/docs/Web/SVG/Attribute/ry$samples/topExample',
      ResourceType.Css, iframe, null)).toBe(ResourceType.Html);
    expect(detectLinkType('https://developer.mozilla.org/zh-CN/docs/XPCOM_Interface_Reference/nsIStreamListener#OnDataAvailable()',
      ResourceType.Html, a, null)).toBe(ResourceType.Html);
    expect(detectLinkType('https://developer.mozilla.org/@api/deki/files/2935/=webfont-sample.html',
      ResourceType.Binary, a, null)).toBe(ResourceType.Html);
    expect(detectLinkType('https://developer.mozilla.org/Add-ons/WebExtensions/manifest.json',
      ResourceType.Binary, a, null)).toBe(ResourceType.Html);
    expect(detectLinkType('https://developer.mozilla.org/Add-ons/WebExtensions/manifest.json',
      ResourceType.Html, a, null)).toBe(ResourceType.Html);
    expect(detectLinkType('https://developer.mozilla.org/Add-ons/WebExtensions/manifest.json',
      ResourceType.Binary, null, null)).toBe(ResourceType.Html);
    expect(detectLinkType('https://developer.mozilla.org/Add-ons/WebExtensions/manifest.json',
      ResourceType.Html, null, null)).toBe(ResourceType.Html);
    expect(detectLinkType('https://developer.mozilla.org/zh-CN/docs/Mozilla/Add-ons/WebExtensions/manifest.json',
      ResourceType.Binary, null, null)).toBe(ResourceType.Html);
    expect(detectLinkType('https://developer.mozilla.org/zh-CN/docs/Mozilla/Add-ons/WebExtensions/manifest.json',
      ResourceType.Html, null, null)).toBe(ResourceType.Html);
  });
  test('binary', () => {
    const a = cheerio.load('<a></a>')('a');
    expect(detectLinkType('https://developer.mozilla.org/@api/deki/files/3783/=codeanalyst4.PNG',
      ResourceType.Html, a, null)).toBe(ResourceType.Binary);
    expect(detectLinkType('https://developer.mozilla.org/files/15838/places-erd.png',
      ResourceType.Binary, null, null)).toBe(ResourceType.Binary);
    expect(detectLinkType('https://mdn.mozillademos.org/files/15838/places-erd.png',
      ResourceType.Html, a, null)).toBe(ResourceType.Binary);
    // contributors.txt should not be parsed as html
    // https://github.com/website-local/mdn-local/issues/205
    expect(detectLinkType('https://developer.mozilla.org/zh-CN/docs/Web/CSS/Reference/contributors.txt',
      ResourceType.Html, a, null)).toBe(ResourceType.Binary);
    expect(detectLinkType('https://developer.mozilla.org/zh-CN/docs/Web/CSS/Reference/index.json',
      ResourceType.Html, a, null)).toBe(ResourceType.Binary);
  });
  test('css', () => {

    const a = cheerio.load('<a></a>')('a');
    expect(detectLinkType('https://developer.mozilla.org/ecosystem-platform/css/main.css',
      ResourceType.Binary, a, null)).toBe(ResourceType.Css);
    expect(detectLinkType('https://developer.mozilla.org/static/build/styles/samples.37902ba3b7fe.css',
      ResourceType.Binary, a, null)).toBe(ResourceType.Css);
    expect(detectLinkType('https://mdn.github.io/css-examples/learn/styles.css',
      ResourceType.Binary, a, null)).toBe(ResourceType.Css);
  });

  // https://github.com/website-local/mdn-local/issues/214
  test('sitemap', () => {
    expect(detectLinkType('https://developer.mozilla.org/sitemaps/en-US/sitemap.xml.gz',
      ResourceType.Binary, null, null)).toBe(ResourceType.SiteMap);
    expect(detectLinkType('https://developer.mozilla.org/sitemaps/zh-CN/sitemap.xml.gz',
      ResourceType.Binary, null, null)).toBe(ResourceType.SiteMap);
  });

  // https://github.com/website-local/mdn-local/issues/372
  test('search-json', () => {
    const parentUrl = 'https://developer.mozilla.org/en-US/search-index.json';
    const parent = {
      type: ResourceType.Binary,
      url: parentUrl,
      uri: URI(parentUrl),
      refUrl: parentUrl,
      rawUrl: parentUrl,
      downloadLink: parentUrl,

    } as Resource;
    const url1 = 'https://developer.mozilla.org/en-US/docs/Games/' +
      'Techniques/3D_on_the_web/Building_up_a_basic_demo_with_Three.js';
    const url2 = 'https://developer.mozilla.org/en-US/docs/Games/Techniques';
    expect(detectLinkType(url1, ResourceType.Binary, null, parent))
      .toBe(ResourceType.Binary);
    expect(detectLinkType(url1, ResourceType.Html, null, parent))
      .toBe(ResourceType.Html);
    expect(detectLinkType(url2, ResourceType.Html, null, parent))
      .toBe(ResourceType.Html);
    parent.meta = {mdnIsSearchJson: true};
    expect(detectLinkType(url1, ResourceType.Html, null, parent))
      .toBe(ResourceType.Html);
    expect(detectLinkType(url2, ResourceType.Html, null, parent))
      .toBe(ResourceType.Html);
    expect(detectLinkType(url1, ResourceType.Binary, null, parent))
      .toBe(ResourceType.Html);
    expect(detectLinkType(url2, ResourceType.Binary, null, parent))
      .toBe(ResourceType.Html);
  });
});
