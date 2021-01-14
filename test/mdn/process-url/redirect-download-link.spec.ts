import {Resource} from 'website-scrap-engine/lib/resource';
import {ResourceType} from 'website-scrap-engine/lib/resource';
import {redirectUrl} from '../../../src/mdn/process-url/redirect-url';
import {
  DownloadOptions,
  StaticDownloadOptions
} from 'website-scrap-engine/lib/options';
import {redirectDownloadLink} from '../../../src/mdn/process-url/redirect-download-link';
import URI = require('urijs');

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

  // https://github.com/myfreeer/mdn-local/issues/46
  test('mdn.github.io large mp4 video', () => {
    const urls = [
      'https://mdn.github.io//learning-area/javascript/apis/video-audio/finished/video/sintel-short.mp4',
      'https://mdn.github.io/html-examples//link-rel-preload/video/sintel-short.mp4',
      'https://mdn.github.io/../imsc/videos/coffee.mp4',
      'https://mdn.github.io/imsc/videos/stars.mp4'
    ];
    for (const url of urls) {
      const resource = res(url);
      redirectDownloadLink(resource);
      expect(resource.uri?.path().startsWith('/mdn-github-io/')).toBeTruthy();
      expect(resource.uri?.host()).toBe('developer.mozilla.org');
      expect(resource.downloadLink).toBe('https://mdn.github.io' +
        '/learning-area/html/multimedia-and-embedding/' +
        'video-and-audio-content/rabbit320.mp4');
    }
  });

  //https://github.com/myfreeer/mdn-local/issues/46
  test('mdn.github.io large webm video', () => {
    const urls = [
      'https://mdn.github.io/learning-area/javascript/apis/video-audio/finished/video/sintel-short.webm',
      'https://mdn.github.io//html-examples/link-rel-preload/video/sintel-short.webm'
    ];
    for (const url of urls) {
      const resource = res(url);
      redirectDownloadLink(resource);
      expect(resource.uri?.path().startsWith('/mdn-github-io/')).toBeTruthy();
      expect(resource.uri?.host()).toBe('developer.mozilla.org');
      expect(resource.downloadLink).toBe('https://mdn.github.io' +
        '/learning-area/html/multimedia-and-embedding/' +
        'video-and-audio-content/rabbit320.webm');
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
});
