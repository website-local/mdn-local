import {redirectUrl} from '../../../src/mdn/process-url/redirect-url';
import {StaticDownloadOptions} from 'website-scrap-engine/lib/options';
import {DownloadOptions} from 'website-scrap-engine/src/options';
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
});