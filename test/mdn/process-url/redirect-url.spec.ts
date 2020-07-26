import {redirectUrl} from '../../../src/mdn/process-url/redirect-url';
import {StaticDownloadOptions} from 'website-scrap-engine/lib/options';
import {DownloadOptions} from 'website-scrap-engine/src/options';
import {Resource, ResourceType} from 'website-scrap-engine/lib/resource';

const opt = (locale: string): StaticDownloadOptions => ({
  localRoot: '/tmp/dummy',
  maxDepth: 1,
  concurrency: 1,
  // hack: force cast
  encoding: {} as DownloadOptions['encoding'],
  meta: {
    locale
  }
});

const fakeRes = (url: string) => ({
  type: ResourceType.Html,
  url,
  refUrl: url,
  rawUrl: url,
  downloadLink: url
}) as Resource;

describe('redirect-url', function () {
  // https://github.com/myfreeer/mdn-local/issues/5
  test('redirecting mdn.mozillademos.org #5', () => {
    expect(redirectUrl('https://mdn.mozillademos.org/files/3855/HTML5_Badge_16.png',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/files/3855/HTML5_Badge_16.png');

    expect(redirectUrl('https://mdn.mozillademos.org/files/12790/owg-logo-dark.svg',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/files/12790/owg-logo-dark.svg');
    // reversion discarded
    // https://github.com/myfreeer/mdn-local/issues/16
    expect(redirectUrl('https://mdn.mozillademos.org/zh-CN/docs/Web/API/Element/innerHTML$samples/Example?revision=1522698',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/docs/Web/API/Element/innerHTML$samples/Example');
    // locale redirected
    expect(redirectUrl('https://mdn.mozillademos.org/en-US/docs/Web/CSS/user-select$samples/Examples?revision=1613617',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/docs/Web/CSS/user-select$samples/Examples');
  });

  // https://github.com/myfreeer/mdn-local/issues/16
  test('discarding url search parameters #16', () => {
    expect(redirectUrl('https://developer.mozilla.org/@api/deki/files/268/=MenuSystemCommands.png?size=webview',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/@api/deki/files/268/=MenuSystemCommands.png');
    expect(redirectUrl('https://developer.mozilla.org/zh-CN/docs/Web/API/IDBCursor?redirectlocale=en-US&redirectslug=IndexedDB%252FIDBCursor',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/docs/Web/API/IDBCursor');
    // this is not a regular redirect
    expect(redirectUrl('https://developer.mozilla.org/zh-CN/Add-ons/Code_snippets/Tabbed_browser?redirectlocale=en-US&redirectslug=Code_snippets%252FTabbed_browser',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/docs/Archive/Add-ons/Tabbed_browser');
    expect(redirectUrl('https://developer.mozilla.org/En/docs/XUL/Attribute/align?raw&macros&include',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/docs/XUL/Attribute/align');
  });
  // https://github.com/myfreeer/mdn-local/issues/20
  test('process bad url #20', () => {
    expect(redirectUrl('https://developer.mozilla.org/../../../../en-US/docs/Code_snippets/Tabbed_browser',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/docs/Archive/Add-ons/Tabbed_browser');
    expect(redirectUrl('https://developer.mozilla.org/../../../../En/Mozilla_developer_guide',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/Mozilla_developer_guide');
    expect(redirectUrl('https://developer.mozilla.org/../../../../en/XUL_Tutorial/Localization',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/XUL_Tutorial/Localization');
    // relative url
    expect(redirectUrl('../../../../en/XUL_Tutorial/Localization',
      null,
      fakeRes('https://developer.mozilla.org/zh-CN/docs/Mozilla/Tech/XUL'),
      opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/XUL_Tutorial/Localization');
  });
  // https://github.com/myfreeer/mdn-local/issues/21
  test('process wrong relative links #21', () => {
    expect(redirectUrl('cn/XUL/Attribute/acceltext',
      null,
      fakeRes('https://developer.mozilla.org/zh-CN/docs/Mozilla/Tech/XUL/Attribute'),
      opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/XUL/Attribute/acceltext');
    expect(redirectUrl('cn/XUL/Attribute/ontextrevert',
      null,
      fakeRes('https://developer.mozilla.org/zh-CN/docs/Mozilla/Tech/XUL/Attribute'),
      opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/XUL/Attribute/ontextrevert');
    expect(redirectUrl('ja/XUL/assign',
      null,
      fakeRes('https://developer.mozilla.org/zh-CN/docs/Mozilla/Tech/XUL/XUL_Reference'),
      opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/XUL/assign');
  });
  // https://github.com/myfreeer/mdn-local/issues/27
  test('redirect wiki.developer.mozilla.org #27', () => {
    expect(redirectUrl('https://wiki.developer.mozilla.org/zh-CN/docs/tag/Accessibility:Tools',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/docs/tag/Accessibility:Tools');
    expect(redirectUrl('https://wiki.developer.mozilla.org/zh-CN/docs/tag/-webkit-appearance',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/docs/tag/-webkit-appearance');
    expect(redirectUrl('https://wiki.developer.mozilla.org/zh-CN/docs/tag/Credibility',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/docs/tag/Credibility');
  });
  // https://github.com/myfreeer/mdn-local/issues/30
  test('redirect interactive-examples #30', () => {
    expect(redirectUrl('https://interactive-examples.mdn.mozilla.net/pages/css/box-sizing.html',
      null,
      fakeRes('https://developer.mozilla.org/zh-CN/docs/Web/CSS/box-sizing'),
      opt('zh-CN')))
      .toBe('https://developer.mozilla.org/interactive-examples/pages/css/box-sizing.html');
  });
  // https://github.com/myfreeer/mdn-local/issues/31
  test('redirect absolute links in interactive-examples #31', () => {
    expect(redirectUrl('/media/examples/star.png',
      null, {
        url: redirectUrl('https://interactive-examples.mdn.mozilla.net/live-examples/css-examples/backgrounds-and-borders/background-position.css',
          null, null, opt('zh-CN')),
        downloadLink: 'https://interactive-examples.mdn.mozilla.net/live-examples/css-examples/backgrounds-and-borders/background-position.css'
      } as Resource, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/interactive-examples/media/examples/star.png');
  });
});
