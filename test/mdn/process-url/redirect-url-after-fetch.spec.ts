import type {
  DownloadResource,
  SubmitResourceFunc
} from 'website-scrap-engine/lib/life-cycle/types';
import {redirectUrl} from '../../../src/mdn/process-url/redirect-url';
import type {
  DownloadOptions,
  StaticDownloadOptions
} from 'website-scrap-engine/lib/options';
import {ResourceType} from 'website-scrap-engine/lib/resource';
import {redirectUrlAfterFetch} from '../../../src/mdn/process-url/redirect-url-after-fetch';
import URI = require('urijs');


const nopSubmit: SubmitResourceFunc = () => void 0;

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

const res = (url: string): DownloadResource => ({
  type: ResourceType.Html,
  url: redirectUrl(url, null, null, opt('en-US')),
  refUrl: url,
  rawUrl: url,
  downloadLink: url,
  redirectedUrl: url,
  body: ''
}) as DownloadResource;

describe('redirect-url-after-fetch', function () {
  test('drop non-mdn redirect', () => {
    const urls = [
      'https://interactive-examples.mdn.mozilla.net/live-examples/css-examples/text/word-break.css',
      'https://mdn.github.io/learning-area/accessibility/html/style.css',
      'https://mdn.github.io/learning-area/accessibility/html/whales.html',
      'https://unpkg.com/imsc@1.1.0-beta.2/build/umd/imsc.all.min.js'
    ];
    for (const url of urls) {
      const r = redirectUrlAfterFetch(res(url), nopSubmit, opt('en-US'));
      expect(r.downloadLink).toBe(url);
      expect(r.redirectedUrl).toBe(r.url);
    }
  });
  test('redirect mdn link to developer.mozilla.org', () => {
    const urls = [
      'https://wiki.developer.mozilla.org/en-US/docs/Web/API',
      'https://developer.cdn.mozilla.net/en-US/docs/Web/API',
      'https://developer.allizom.org/en-US/docs/Web/API',
      'https://mdn.mozillademos.org/files/3855/HTML5_Badge_16.png'
    ];
    for (const url of urls) {
      const r = redirectUrlAfterFetch(res(url), nopSubmit, opt('en-US'));
      expect(r.downloadLink).toBe(url);
      expect(r.redirectedUrl).toBe(r.url);
      expect(URI(r.redirectedUrl).host()).toBe('developer.mozilla.org');
    }
  });
  test('redirect mdn link with locale', () => {
    const urls = [
      'https://wiki.developer.mozilla.org/en-US/docs/Web/API',
      'https://developer.cdn.mozilla.net/en-US/docs/Web/API',
      'https://developer.allizom.org/en-US/docs/Web/API'
    ];
    for (const url of urls) {
      const r = redirectUrlAfterFetch(res(url), nopSubmit, opt('zh-CN'));
      expect(URI(r.redirectedUrl).path().split('/')[1]).toBe('zh-CN');
    }
  });
});
