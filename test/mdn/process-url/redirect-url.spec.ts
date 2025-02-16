import {redirectUrl} from '../../../src/mdn/process-url/redirect-url.js';
import type {
  DownloadOptions,
  StaticDownloadOptions
} from 'website-scrap-engine/lib/options.js';
import type {Resource} from 'website-scrap-engine/lib/resource.js';
import {ResourceType} from 'website-scrap-engine/lib/resource.js';

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
  // commit 40ec1502704e6e363f6ab4d691d002125987b7cd
  // 2019/3/2 10:15
  test('append locale to path', () => {
    expect(redirectUrl('https://developer.mozilla.org/docs',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/docs');
    expect(redirectUrl('https://developer.mozilla.org/docs/Web',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/docs/Web');
    expect(redirectUrl('https://developer.mozilla.org/Web',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/docs/Web');
    expect(redirectUrl('https://developer.mozilla.org/',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/');
  });

  // commit fae4c11784f1168ff3d2a5af5ea45c6ee2cf874b
  // 2019/8/28 20:43
  test('redirect malformed url to more current location', () => {
    expect(redirectUrl('https://developer.mozilla.org/en/JavaScript',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/docs/Web/JavaScript');
    expect(redirectUrl('https://developer.mozilla.org/Ja/API',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/docs/Web/API');
    expect(redirectUrl('https://developer.mozilla.org/zu/XPath',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/docs/Web/XPath');

    expect(redirectUrl('https://developer.mozilla.org/zu/Web',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/docs/Web');
    expect(redirectUrl('https://developer.mozilla.org/ln/Mozilla',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/docs/Mozilla');
    expect(redirectUrl('https://developer.mozilla.org/zu/Learn',
      null, null, opt('en-US')))
      .toBe('https://developer.mozilla.org/en-US/docs/Learn');
  });

  // commit 196e529cc84517f7a92564f8ddc2a0c726d2d90a
  // 2019/9/4 19:10
  test('redirect links to dom', () => {
    expect(redirectUrl('https://developer.mozilla.org/DOM',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/docs/Web/API');
    expect(redirectUrl('https://developer.mozilla.org/ja/DOM/',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/docs/Web/API/');
  });

  // commit 4f7441eb591610b99da157def9ee726365cd64b2
  // 2019/9/4 19:59
  test('redirect bad link with locale and docs', () => {
    expect(redirectUrl('https://developer.mozilla.org/zh-CNdocs/Web',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/docs/Web');
    expect(redirectUrl('https://developer.mozilla.org/en-USdocs/Web',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/docs/Web');
  });

  // commit e7f67301380a9338ff36f231749999497cfe1717
  // 2019/9/13 15:46
  test('redirect http link to https', () => {
    expect(redirectUrl('http://developer.mozilla.org/docs',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/docs');

    expect(redirectUrl('http://mdn.mozillademos.org/files/3855/HTML5_Badge_16.png',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/files/3855/HTML5_Badge_16.png');

    expect(redirectUrl('http://interactive-examples.mdn.mozilla.net/pages/css/box-sizing.html',
      null,
      fakeRes('https://developer.mozilla.org/zh-CN/docs/Web/CSS/box-sizing'),
      opt('zh-CN')))
      .toBe('https://developer.mozilla.org/interactive-examples/pages/css/box-sizing.html');

    expect(redirectUrl('http://mdn.github.io/web-tech-games/index.html',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/mdn-github-io/web-tech-games/index.html');
  });

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

  });

  // https://github.com/myfreeer/mdn-local/issues/20
  test('process bad url #20', () => {
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

  // https://github.com/myfreeer/mdn-local/issues/32
  test('redirect mdn.github.io #32', () => {
    expect(redirectUrl('https://mdn.github.io/web-tech-games/index.html',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/mdn-github-io/web-tech-games/index.html');
    expect(redirectUrl('https://mdn.github.io/dom-examples/channel-messaging-basic/',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/mdn-github-io/dom-examples/channel-messaging-basic/');
    expect(redirectUrl('style.css',
      null,
      {
        url: 'https://developer.mozilla.org/mdn-github-io/webaudio-examples/panner-node/',
        downloadLink: 'https://mdn.github.io/webaudio-examples/panner-node/'
      } as Resource,
      opt('zh-CN')))
      .toBe('https://developer.mozilla.org/mdn-github-io/webaudio-examples/panner-node/style.css');

    // absolute url, not likely to happen
    expect(redirectUrl('/webaudio-examples/panner-node/style.css',
      null,
      {
        url: 'https://developer.mozilla.org/mdn-github-io/webaudio-examples/panner-node/',
        downloadLink: 'https://mdn.github.io/webaudio-examples/panner-node/'
      } as Resource,
      opt('zh-CN')))
      .toBe('https://developer.mozilla.org/mdn-github-io/webaudio-examples/panner-node/style.css');
  });

  // https://github.com/myfreeer/mdn-local/issues/34
  // https://github.com/mdn/yari/pull/39
  // https://github.com/website-local/mdn-local/issues/211
  test('redirect unexpected favicon #34', () => {
    expect(redirectUrl('https://developer.cdn.mozilla.net/media/redesign/img/favicon32.png',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/favicon.ico');
    expect(redirectUrl('http://www.mozilla.org/favicon.ico',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/favicon.ico');
    expect(redirectUrl('https://mozorg.cdn.mozilla.net/media/img/favicon.ico',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/favicon.ico');
    expect(redirectUrl('http://w3c.org/2008/site/images/favicon.ico',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/favicon.ico');
  });

  // https://github.com/myfreeer/mdn-local/issues/38
  test('resolve malformed links #38', () => {
    expect(redirectUrl('/zh-CN/docs/https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys',
      null,
      fakeRes('https://developer.mozilla.org/zh-CN/docs/Tools/Web_Console/Helpers'),
      opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/keys');

    expect(redirectUrl('zh-CN/docs/Install_Manifests#targetApplication',
      null,
      fakeRes('https://developer.mozilla.org/zh-CN/docs/Mozilla/Toolkit_version_format'),
      opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/docs/Install_Manifests#targetApplication');

    expect(redirectUrl('../../zh-cn/docs/JavaScript/Reference/Global_Objects/Map',
      null,
      fakeRes('https://developer.mozilla.org/zh-CN/docs/Mozilla/Firefox/Releases/17'),
      opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Map');

    expect(redirectUrl('&lt;https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/Tutorial_local_library_website>',
      null,
      fakeRes('https://developer.mozilla.org/zh-CN/docs/learn/Server-side/Express_Nodejs/Installing_on_PWS_Cloud_Foundry'),
      opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/docs/Learn/Server-side/Express_Nodejs/Tutorial_local_library_website');

    // language=none
    expect(redirectUrl('<https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/Tutorial_local_library_website>',
      null,
      fakeRes('https://developer.mozilla.org/zh-CN/docs/learn/Server-side/Express_Nodejs/Installing_on_PWS_Cloud_Foundry'),
      opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/docs/Learn/Server-side/Express_Nodejs/Tutorial_local_library_website');

    expect(redirectUrl('<https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/Tutorial_local_library_website&gt;',
      null,
      fakeRes('https://developer.mozilla.org/zh-CN/docs/learn/Server-side/Express_Nodejs/Installing_on_PWS_Cloud_Foundry'),
      opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/docs/Learn/Server-side/Express_Nodejs/Tutorial_local_library_website');

    expect(redirectUrl('../../en-US/docs/Mercurial',
      null,
      fakeRes('https://developer.mozilla.org/zh-CN/docs/Mozilla_Source_Code_Directory_Structure'),
      opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/docs/Mercurial');

    expect(redirectUrl('../../en-US/docs/Mercurial',
      null,
      fakeRes('https://developer.mozilla.org/zh-CN/docs/Mozilla_Source_Code_Directory_Structure'),
      opt('en-US')))
      .toBe('https://developer.mozilla.org/en-US/docs/Mercurial');

  });

  // commit b6b2c169a630853f90d50b96e9a6c85f9dcbeaf6
  // 2020/3/8 17:38
  test('url with baseURL prefix', () => {
    expect(redirectUrl('<=%=baseURLhttps://developer.mozilla.org/zh-CN/',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/');
    expect(redirectUrl('<=%=baseURLhttps://developer.mozilla.org/en-US/',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/');
  });

  // commit f11a10c439357164877bb15fd50029ac80c519b6
  // 2020/3/28 16:32
  test('redirect unpkg.com', () => {
    expect(redirectUrl('https://unpkg.com/imsc@1.1.0-beta.2/build/umd/imsc.all.min.js',
      null,
      {
        url: 'https://developer.mozilla.org/mdn-github-io/imsc/imscjs-demo/imscjs-demo.html',
        downloadLink: 'https://mdn.github.io/imsc/imscjs-demo/imscjs-demo.html'
      } as Resource,
      opt('zh-CN')))
      .toBe('https://developer.mozilla.org/unpkg-com/imsc@1.1.0-beta.2/build/umd/imsc.all.min.js');

    // absolute url, not likely to happen
    expect(redirectUrl('/imsc@1.1.0-beta.2/build/umd/imsc.all.min.js',
      null,
      {
        url: 'https://developer.mozilla.org/unpkg-com/imsc@1.1.0-beta.2/build/umd/imsc.all.min.js',
        downloadLink: 'https://unpkg.com/imsc@1.1.0-beta.2/build/umd/imsc.all.min.js'
      } as Resource,
      opt('zh-CN')))
      .toBe('https://developer.mozilla.org/unpkg-com/imsc@1.1.0-beta.2/build/umd/imsc.all.min.js');
  });

  // https://github.com/website-local/mdn-local/issues/361
  // 2021/07/18
  test('redirect cdnjs.cloudflare.com', () => {
    expect(redirectUrl('https://cdnjs.cloudflare.com/ajax/libs/gl-matrix/2.8.1/gl-matrix-min.js',
      null,
      {
        url: 'https://developer.mozilla.org/mdn-github-io/webgl-examples/sample8/index.html',
        downloadLink: 'https://mdn.github.io/webgl-examples/sample8/index.html'
      } as Resource,
      opt('zh-CN')))
      .toBe('https://developer.mozilla.org/cdnjs-cloudflare-com/ajax/libs/gl-matrix/2.8.1/gl-matrix-min.js');

    // absolute url, not likely to happen
    expect(redirectUrl('/ajax/libs/gl-matrix/2.8.1/gl-matrix-min.js',
      null,
      {
        url: 'https://developer.mozilla.org/cdnjs-cloudflare-com/ajax/libs/gl-matrix/2.8.1/gl-matrix-min.js',
        downloadLink: 'https://cdnjs.cloudflare.com/ajax/libs/gl-matrix/2.8.1/gl-matrix-min.js'
      } as Resource,
      opt('zh-CN')))
      .toBe('https://developer.mozilla.org/cdnjs-cloudflare-com/ajax/libs/gl-matrix/2.8.1/gl-matrix-min.js');

    // relative url, not likely to happen
    expect(redirectUrl('gl-matrix-min.js',
      null,
      {
        url: 'https://developer.mozilla.org/cdnjs-cloudflare-com/ajax/libs/gl-matrix/2.8.1/gl-matrix-min.js',
        downloadLink: 'https://cdnjs.cloudflare.com/ajax/libs/gl-matrix/2.8.1/gl-matrix-min.js'
      } as Resource,
      opt('zh-CN')))
      .toBe('https://developer.mozilla.org/cdnjs-cloudflare-com/ajax/libs/gl-matrix/2.8.1/gl-matrix-min.js');
  });

  // https://github.com/website-local/mdn-local/issues/448
  // 2021/11/15
  test('redirect cdn.jsdelivr.net', () => {
    // https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Cross_browser_testing/JavaScript#cross-browser_javascript_problems
    // -> https://mdn.github.io/learning-area/tools-testing/cross-browser-testing/javascript/fetch-polyfill-finished.html
    // ->    https://cdn.jsdelivr.net/npm/es6-promise@4/dist/es6-promise.min.js

    expect(redirectUrl('https://cdn.jsdelivr.net/npm/es6-promise@4/dist/es6-promise.min.js',
      null,
      {
        url: 'https://developer.mozilla.org/mdn-github-io/learning-area/tools-testing/cross-browser-testing/javascript/fetch-polyfill-finished.html',
        downloadLink: 'https://mdn.github.io/learning-area/tools-testing/cross-browser-testing/javascript/fetch-polyfill-finished.html'
      } as Resource,
      opt('zh-CN')))
      .toBe('https://developer.mozilla.org/cdn-jsdelivr-net/npm/es6-promise@4/dist/es6-promise.min.js');

    // absolute path url, not likely to happen
    expect(redirectUrl('/npm/es6-promise@4/dist/es6-promise.min.js',
      null,
      {
        url: 'https://developer.mozilla.org/cdn-jsdelivr-net/npm/es6-promise@4/dist/es6-promise.min.js',
        downloadLink: 'https://cdn.jsdelivr.net/npm/es6-promise@4/dist/es6-promise.min.js'
      } as Resource,
      opt('zh-CN')))
      .toBe('https://developer.mozilla.org/cdn-jsdelivr-net/npm/es6-promise@4/dist/es6-promise.min.js');

    // relative url, not likely to happen
    expect(redirectUrl('../dist/es6-promise.min.js',
      null,
      {
        url: 'https://developer.mozilla.org/cdn-jsdelivr-net/npm/es6-promise@4/dist/es6-promise.min.js',
        downloadLink: 'https://cdn.jsdelivr.net/npm/es6-promise@4/dist/es6-promise.min.js'
      } as Resource,
      opt('zh-CN')))
      .toBe('https://developer.mozilla.org/cdn-jsdelivr-net/npm/es6-promise@4/dist/es6-promise.min.js');

  });

  // commit 2ee5f6baa338c4edd621f02c77169d651461a10e
  // 2020/3/28 16:20
  // commit 154a73daead1eb2af1a744af432580e0f6ff6b9d
  // 2020/4/1 21:17
  test('url with nested code tag', () => {
    expect(redirectUrl('<code>https://developer.mozilla.org/zh-CN/</code>',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/');
    expect(redirectUrl('%3Ccode%3Ehttps://developer.mozilla.org/en-US/%3C/code%3E',
      null, null, opt('zh-CN')))
      .toBe('https://developer.mozilla.org/zh-CN/');
  });

  // commit 913c128377428b7b181bdee397c465f5b1e43a3a
  // 2020/5/14 20:19
  // also note that this url should be discarded before redirect
  test('redirect url with bad protocol', () => {
    expect(redirectUrl('https:\\\\google.com',
      null,
      // the real url with this bad link
      // Last modified: Nov 29, 2019, by MDN contributors
      fakeRes('https://developer.mozilla.org/en-US/docs/Learn/Server-side/First_steps/Introduction'),
      opt('zh-CN')))
      .toBe('https://google.com');
  });

  // 2020/7/30
  test('redirect bad url nested in quotes', () => {

    expect(redirectUrl('%28https://wiki.mozilla.org/Labs/Jetpack/JEP/24%29',
      null,
      // the real url with this bad link
      // Last modified: Sep 20, 2018, by MDN contributors
      fakeRes('https://developer.mozilla.org/en-US/docs/Archive/Mozilla/Jetpack/Meta/settings'),
      opt('en-US')))
      .toBe('https://wiki.mozilla.org/Labs/Jetpack/JEP/24');
    expect(redirectUrl('(https://wiki.mozilla.org/Labs/Jetpack/JEP/30)',
      null,
      // the real url with this bad link
      // Last modified: Sep 20, 2018, by MDN contributors
      fakeRes('https://developer.mozilla.org/en-US/docs/Archive/Mozilla/Jetpack/Meta/firstrun'),
      opt('en-US')))
      .toBe('https://wiki.mozilla.org/Labs/Jetpack/JEP/30');
    expect(redirectUrl('/(https://wiki.mozilla.org/Labs/Jetpack/JEP/13)',
      null,
      // the real url with this bad link
      // Last modified: Mar 23, 2019, by MDN contributors
      fakeRes('https://developer.mozilla.org/en-US/docs/Archive/Mozilla/Jetpack/Meta/Me'),
      opt('en-US')))
      .toBe('https://wiki.mozilla.org/Labs/Jetpack/JEP/13');
    expect(redirectUrl('/%28https://wiki.mozilla.org/Labs/Jetpack/JEP/30%29',
      null,
      // the real url with this bad link
      // Last modified: Mar 23, 2019, by MDN contributors
      fakeRes('https://developer.mozilla.org/en-US/docs/Archive/Mozilla/Jetpack/UI/Selection'),
      opt('en-US')))
      .toBe('https://wiki.mozilla.org/Labs/Jetpack/JEP/30');
  });

  // https://github.com/website-local/mdn-local/issues/208
  test('redirect mdn.mozit.cloud', () => {
    expect(redirectUrl(
      'https://yari-demos.prod.mdn.mozit.cloud/en-US/docs/Web/' +
      'API/CanvasRenderingContext2D/quadraticCurveTo/_samples_/' +
      'How_quadraticCurveTo_works',
      null,
      // the real url with this link
      fakeRes('https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/quadraticCurveTo'),
      opt('zh-CN')))
      .toBe('https://developer.mozilla.org/mdn.mozit.cloud/' +
        'yari-demos.prod.mdn.mozit.cloud/en-US/' +
        'docs/Web/API/CanvasRenderingContext2D/quadraticCurveTo/' +
        '_samples_/How_quadraticCurveTo_works');

    expect(redirectUrl(
      'https://yari-demos.prod.mdn.mozit.cloud/en-US/docs/Learn/CSS/' +
      'CSS_layout/Positioning/_samples_/Introducing_top_bottom_left_and_right',
      null,
      // the real url with this link
      fakeRes('https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Positioning'),
      opt('zh-CN')))
      .toBe('https://developer.mozilla.org/mdn.mozit.cloud/' +
        'yari-demos.prod.mdn.mozit.cloud/en-US/docs/Learn/CSS/' +
        'CSS_layout/Positioning/_samples_/Introducing_top_bottom_left_and_right');

    expect(redirectUrl(
      'https://yari-demos.prod.mdn.mozit.cloud/en-us/' +
      'docs/web/api/htmlformelement/_samples_/inheritance_diagram',
      null,
      // the real url with this link
      fakeRes('https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement'),
      opt('zh-CN')))
      .toBe('https://developer.mozilla.org/mdn.mozit.cloud/' +
        'yari-demos.prod.mdn.mozit.cloud/en-us/docs/' +
        'web/api/htmlformelement/_samples_/inheritance_diagram');

    expect(redirectUrl(
      'https://yari-demos.prod.mdn.mozit.cloud/en-US/docs/' +
      'Web/CSS/blend-mode/_samples_/normal_example',
      null,
      // the real url with this link
      fakeRes('https://developer.mozilla.org/en-US/docs/Web/CSS/blend-mode'),
      opt('zh-CN')))
      .toBe('https://developer.mozilla.org/mdn.mozit.cloud/' +
        'yari-demos.prod.mdn.mozit.cloud/en-US/docs/Web/CSS/' +
        'blend-mode/_samples_/normal_example');

    expect(redirectUrl(
      'https://media.prod.mdn.mozit.cloud/attachments/' +
      '2012/07/09/3075/89b1e0a26e8421e19f907e0522b188bd/svgdemo1.xml',
      null,
      // the real url with this link
      fakeRes('https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Getting_Started'),
      opt('zh-CN')))
      .toBe('https://developer.mozilla.org/mdn.mozit.cloud/' +
        'media.prod.mdn.mozit.cloud/attachments/2012/07/09/' +
        '3075/89b1e0a26e8421e19f907e0522b188bd/svgdemo1.xml');

    // There seems no http links currently, this is only for test
    expect(redirectUrl(
      'http://media.prod.mdn.mozit.cloud/attachments/' +
      '2012/07/09/3075/89b1e0a26e8421e19f907e0522b188bd/svgdemo1.xml',
      null,
      fakeRes('https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Getting_Started'),
      opt('zh-CN')))
      .toBe('https://developer.mozilla.org/mdn.mozit.cloud/' +
        'media.prod.mdn.mozit.cloud/attachments/2012/07/09/' +
        '3075/89b1e0a26e8421e19f907e0522b188bd/svgdemo1.xml');
  });
});
