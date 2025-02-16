import {describe, expect, test} from '@jest/globals';
import type {Resource} from 'website-scrap-engine/lib/resource.js';
import {ResourceType} from 'website-scrap-engine/lib/resource.js';
import {redirectUrl} from '../../../src/mdn/process-url/redirect-url.js';
import type {
  DownloadOptions,
  StaticDownloadOptions
} from 'website-scrap-engine/lib/options.js';
import {
  redirectDownloadLink
} from '../../../src/mdn/process-url/redirect-download-link.js';
import URI from 'urijs';

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

const res = (url: string): Resource => {
  const r = redirectUrl(url, null, null, opt('en-US')) as string;
  return ({
    type: ResourceType.Html,
    url: r,
    uri: URI(r),
    refUrl: url,
    rawUrl: r,
    downloadLink: r
  }) as Resource;
};

describe('redirect-download-link', function () {
  test('normal link', () => {
    const urls = [
      'https://developer.mozilla.org/ecosystem-platform/js/scrollSpy.js',
      'https://developer.mozilla.org/en-US/docs/Archive/Mozilla/Firefox/Accounts/Introduction',
      'https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/remoteDescription',
      'https://developer.mozilla.org/en-US/docs/Web'
    ];
    for (const url of urls) {
      const resource = res(url);
      redirectDownloadLink(resource);
      expect(resource.uri?.host()).toBe('developer.mozilla.org');
      expect(resource.downloadLink).toBe(url);
      expect(resource.downloadLink).toBe(resource.url);
    }
  });

  // https://github.com/myfreeer/mdn-local/issues/29
  test('mdn.mozillademos.org', () => {
    const urls = [
      'https://mdn.mozillademos.org/files/8543/br.png',
      'https://mdn.mozillademos.org/files/8545/tr.png',
      'https://mdn.mozillademos.org/files/3712/Test_Form_3.jpeg',
      'https://mdn.mozillademos.org/en-US/docs/Web/CSS/:active$samples/Active_links',
      'https://mdn.mozillademos.org/en-US/docs/Web/CSS/:active$samples/Active_form_elements'
    ];
    for (const url of urls) {
      const resource = res(url);
      redirectDownloadLink(resource);
      expect(resource.uri?.host()).toBe('developer.mozilla.org');
      expect(resource.downloadLink).toBe(url);
    }
  });

  // https://github.com/myfreeer/mdn-local/issues/30
  test('interactive-examples.mdn.mozilla.net', () => {
    const urls = [
      'https://interactive-examples.mdn.mozilla.net/pages/tabbed/img.html',
      'https://interactive-examples.mdn.mozilla.net/pages/tabbed/tbody.html',
      'https://interactive-examples.mdn.mozilla.net/pages/css/align-self.html',
      'https://interactive-examples.mdn.mozilla.net/js/css-examples-libs.js',
      'https://interactive-examples.mdn.mozilla.net/js/editor-css.js'
    ];
    for (const url of urls) {
      const resource = res(url);
      redirectDownloadLink(resource);
      expect(resource.uri?.path().startsWith('/interactive-examples/')).toBeTruthy();
      expect(resource.uri?.host()).toBe('developer.mozilla.org');
      expect(resource.downloadLink).toBe(url);
    }
  });

  // https://github.com/myfreeer/mdn-local/issues/32
  test('mdn.github.io', () => {
    const urls = [
      'https://mdn.github.io/webextensions-examples/content-script-page-script-messaging.html',
      'https://mdn.github.io/to-do-notifications/',
      'https://mdn.github.io/learning-area/html/tables/basic/timetable-fixed.html',
      'https://mdn.github.io/web-tech-games/styles.css',
      'https://mdn.github.io/webvr-tests/positionsensorvrdevice/'
    ];
    for (const url of urls) {
      const resource = res(url);
      redirectDownloadLink(resource);
      expect(resource.uri?.path().startsWith('/mdn-github-io/')).toBeTruthy();
      expect(resource.uri?.host()).toBe('developer.mozilla.org');
      expect(resource.downloadLink).toBe(url);
    }
  });

  // commit f11a10c439357164877bb15fd50029ac80c519b6
  // 2020/3/28 16:32
  test('unpkg.com', () => {
    const urls = [
      'https://unpkg.com/mermaid@8.4.2/dist/mermaid.min.js',
      'https://unpkg.com/imsc@1.1.0-beta.2/build/umd/imsc.all.min.js'
    ];
    for (const url of urls) {
      const resource = res(url);
      redirectDownloadLink(resource);
      expect(resource.uri?.path().startsWith('/unpkg-com/')).toBeTruthy();
      expect(resource.uri?.host()).toBe('developer.mozilla.org');
      expect(resource.downloadLink).toBe(url);
    }
  });

  // https://github.com/website-local/mdn-local/issues/361
  // 2021/07/18
  test('cdnjs.cloudflare.com', () => {
    const urls = [
      'https://cdnjs.cloudflare.com/ajax/libs/gl-matrix/2.8.1/gl-matrix-min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/html5shiv/3.7.3/html5shiv.js',
      'https://cdnjs.cloudflare.com/ajax/libs/crafty/0.5.4/crafty-min.js'
    ];
    for (const url of urls) {
      const resource = res(url);
      redirectDownloadLink(resource);
      expect(resource.uri?.path().startsWith('/cdnjs-cloudflare-com/')).toBeTruthy();
      expect(resource.uri?.host()).toBe('developer.mozilla.org');
      expect(resource.downloadLink).toBe(url);
    }
  });

  // https://github.com/website-local/mdn-local/issues/448
  // 2021/11/15
  test('cdn.jsdelivr.net', () => {
    const urls = [
      'https://cdn.jsdelivr.net/npm/es6-promise@4/dist/es6-promise.min.js'
    ];
    for (const url of urls) {
      const resource = res(url);
      redirectDownloadLink(resource);
      expect(resource.uri?.path().startsWith('/cdn-jsdelivr-net/')).toBeTruthy();
      expect(resource.uri?.host()).toBe('developer.mozilla.org');
      expect(resource.downloadLink).toBe(url);
    }
  });

  // https://github.com/website-local/mdn-local/issues/208
  test('redirect mdn.mozit.cloud', () => {
    const urls = [
      'https://yari-demos.prod.mdn.mozit.cloud/en-US/docs/Web/' +
      'API/CanvasRenderingContext2D/quadraticCurveTo/_samples_/' +
      'How_quadraticCurveTo_works',
      'https://yari-demos.prod.mdn.mozit.cloud/en-US/docs/Learn/CSS/' +
      'CSS_layout/Positioning/_samples_/Introducing_top_bottom_left_and_right',
      'https://yari-demos.prod.mdn.mozit.cloud/en-us/' +
      'docs/web/api/htmlformelement/_samples_/inheritance_diagram',
      'https://yari-demos.prod.mdn.mozit.cloud/en-US/docs/' +
      'Web/CSS/blend-mode/_samples_/normal_example',
      'https://media.prod.mdn.mozit.cloud/attachments/' +
      '2012/07/09/3075/89b1e0a26e8421e19f907e0522b188bd/svgdemo1.xml'
    ];

    for (const url of urls) {
      const resource = res(url);
      redirectDownloadLink(resource);
      expect(resource.uri?.path().startsWith('/mdn.mozit.cloud/')).toBeTruthy();
      expect(resource.uri?.host()).toBe('developer.mozilla.org');
      expect(resource.downloadLink).toBe(url);
    }
  });

  // https://github.com/mdn/yari/commit/6e9fb23dad1571a463e06db7e280e6479b2582bd
  // https://github.com/website-local/mdn-local/issues/890
  // 20230716
  test('bcd.developer.mozilla.org', () => {
    const urls = [
      'https://developer.mozilla.org/bcd/api/v0/current/css.properties.grid.json'
    ];
    for (const url of urls) {
      const resource = res(url);
      redirectDownloadLink(resource);
      expect(resource.uri?.host()).toBe('developer.mozilla.org');
      expect(resource.downloadLink).toBe('https://bcd.developer.mozilla.org/bcd/api/v0/current/css.properties.grid.json');
    }
  });

  // https://github.com/website-local/mdn-local/issues/891
  // 20230716
  test('live.mdnplay.dev', () => {
    const urls = [
      'https://3b2c6cbd-0e90-4934-8c02-8e8c4b08e767.mdnplay.dev/runner.html',
      'https://live.mdnplay.dev/en-US/docs/Web/CSS/grid/runner.html?id=creating_a_grid_layout'
    ];
    const expected = [
      'https://live.mdnplay.dev/runner.html',
      'https://live.mdnplay.dev/en-US/docs/Web/CSS/grid/runner.html'
    ];
    for (let i = 0; i < urls.length; i++){
      const url = urls[i];
      const resource = res(url);
      redirectDownloadLink(resource);
      expect(resource.uri?.host()).toBe('developer.mozilla.org');
      expect(resource.downloadLink).toBe(expected[i]);
    }
  });

});
