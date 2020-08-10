import {detectLinkType} from '../../../src/mdn/process-url/detect-link-type';
import {ResourceType} from 'website-scrap-engine/lib/resource';
import cheerio from 'cheerio';

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
  });
  test('binary', () => {
    const a = cheerio.load('<a></a>')('a');
    expect(detectLinkType('https://developer.mozilla.org/@api/deki/files/3783/=codeanalyst4.PNG',
      ResourceType.Html, a, null)).toBe(ResourceType.Binary);
    expect(detectLinkType('https://developer.mozilla.org/files/15838/places-erd.png',
      ResourceType.Binary, null, null)).toBe(ResourceType.Binary);
    expect(detectLinkType('https://mdn.mozillademos.org/files/15838/places-erd.png',
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
});
