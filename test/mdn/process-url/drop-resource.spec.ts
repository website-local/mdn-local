import {describe, expect, test} from '@jest/globals';
import {dropResource} from '../../../src/mdn/process-url/drop-resource.js';
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

describe('drop-resource', function () {
  test('discard fake local mdn.dev legacy site paths', () => {
    const dropped = dropResource(
      fakeRes('https://developer.mozilla.org/mdn.dev/en-US/about'),
      null,
      null,
      opt('en-US')
    );
    expect(dropped?.shouldBeDiscardedFromDownload).toBe(true);
  });

  test('keep mdn.dev archives and generic-content paths', () => {
    const archive = dropResource(
      fakeRes('https://developer.mozilla.org/mdn.dev/archives/media/samples/domref/dispatchEvent.html'),
      null,
      null,
      opt('en-US')
    );
    const generic = dropResource(
      fakeRes('https://developer.mozilla.org/mdn.dev/generic-content/about/screenshots/20050121103200-960x540@1x.png'),
      null,
      null,
      opt('en-US')
    );

    expect(archive?.shouldBeDiscardedFromDownload).not.toBe(true);
    expect(generic?.shouldBeDiscardedFromDownload).not.toBe(true);
  });

  test('discard dead legacy sample stylesheets', () => {
    for (const url of [
      'https://developer.mozilla.org/mdn.dev/css/base.css',
      'https://developer.mozilla.org/mdn.dev/css/wiki.css',
      'https://developer.mozilla.org/css/base.css',
      'https://developer.mozilla.org/css/wiki.css'
    ]) {
      const dropped = dropResource(fakeRes(url), null, null, opt('en-US'));
      expect(dropped?.shouldBeDiscardedFromDownload).toBe(true);
    }
  });

  test('keep archived cssref stylesheet path', () => {
    const res = dropResource(
      fakeRes('https://developer.mozilla.org/mdn.dev/archives/media/samples/cssref/cssref.css'),
      null,
      null,
      opt('en-US')
    );
    expect(res?.shouldBeDiscardedFromDownload).not.toBe(true);
  });

  test('discard standalone playground routes', () => {
    for (const url of [
      'https://developer.mozilla.org/en-US/play',
      'https://developer.mozilla.org/en-US/play/',
      'https://developer.mozilla.org/en-US/play.html',
      'https://developer.mozilla.org/zh-CN/play'
    ]) {
      const locale = url.includes('/zh-CN/') ? 'zh-CN' : 'en-US';
      const dropped = dropResource(fakeRes(url), null, null, opt(locale));
      expect(dropped?.shouldBeDiscardedFromDownload).toBe(true);
    }
  });

  test('keep API pages named play', () => {
    const res = dropResource(
      fakeRes('https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play'),
      null,
      null,
      opt('en-US')
    );
    expect(res?.shouldBeDiscardedFromDownload).not.toBe(true);
  });
});
