import {describe, expect, test} from '@jest/globals';
import type {
  DownloadOptions,
  StaticDownloadOptions
} from 'website-scrap-engine/lib/options.js';
import {
  createResource,
  ResourceType
} from 'website-scrap-engine/lib/resource.js';
import {
  officialExternalRedirectCount,
  officialExternalRedirectFallbackExclusionCount,
  officialExternalRedirectSources
} from '../../../src/mdn/process-url/generated-official-external-redirects.js';
import {
  processOfficialExternalRedirect,
  resolveOfficialExternalRedirect
} from '../../../src/mdn/process-url/official-external-redirect.js';
import {redirectUrl} from '../../../src/mdn/process-url/redirect-url.js';

const opt = (locale: string): StaticDownloadOptions => ({
  localRoot: '/tmp/dummy',
  maxDepth: 1,
  concurrency: 1,
  encoding: {} as DownloadOptions['encoding'],
  meta: {
    locale
  }
});

const resource = (url: string) => createResource({
  type: ResourceType.Html,
  depth: 0,
  url,
  refUrl: url,
  localRoot: '/tmp/dummy'
});

describe('official external redirects', () => {
  test('contains generated rules from content and translated-content', () => {
    expect(officialExternalRedirectCount).toBeGreaterThan(1000);
    expect(officialExternalRedirectFallbackExclusionCount).toBeGreaterThan(0);
    expect(officialExternalRedirectSources.map(source => source.repository))
      .toEqual(['mdn/content', 'mdn/translated-content']);
    expect(officialExternalRedirectSources[1].paths)
      .toContain('files/zh-tw/_redirects.txt');
  });

  test('resolves English and translated redirect paths', () => {
    expect(resolveOfficialExternalRedirect(
      'https://developer.mozilla.org/en-US/docs/Tools/Memory'
    )).toBe(
      'https://firefox-source-docs.mozilla.org/devtools-user/memory/index.html'
    );
    expect(resolveOfficialExternalRedirect(
      'https://developer.mozilla.org/zh-CN/docs/Tools/Memory'
    )).toBe(
      'https://firefox-source-docs.mozilla.org/devtools-user/memory/index.html'
    );
    expect(resolveOfficialExternalRedirect(
      'https://developer.mozilla.org/zh-TW/docs/Tools/Debugger'
    )).toBe(
      'https://firefox-source-docs.mozilla.org/devtools-user/debugger/index.html'
    );
  });

  test('keeps the MDN source path until the external replacement hook runs', () => {
    const url = 'https://developer.mozilla.org/en-US/docs/Tools/Memory';
    expect(redirectUrl(url, null, null, opt('en-US'))).toBe(url);
  });

  test('preserves a source fragment unless the official target has one', () => {
    expect(resolveOfficialExternalRedirect(
      'https://developer.mozilla.org/en-US/docs/Tools/Memory#snapshots'
    )).toBe(
      'https://firefox-source-docs.mozilla.org/devtools-user/memory/' +
      'index.html#snapshots'
    );
    expect(resolveOfficialExternalRedirect(
      'https://developer.mozilla.org/en-US/docs/Tools/Page_Inspector/' +
      'How_to/Use_the_Inspector_API#ignored'
    )).toBe(
      'https://firefox-source-docs.mozilla.org/devtools-user/index.html' +
      '#page-inspector'
    );
  });

  test('uses en-US external redirects for missing localized pages', () => {
    expect(resolveOfficialExternalRedirect(
      'https://developer.mozilla.org/zh-CN/docs/Mozilla/Add-ons/Themes',
      'developer.mozilla.org',
      true
    )).toBe('https://extensionworkshop.com/documentation/themes/');
    expect(resolveOfficialExternalRedirect(
      'https://developer.mozilla.org/zh-CN/docs/Mozilla/Performance/' +
      'Profiling_with_the_Built-in_Profiler',
      'developer.mozilla.org',
      true
    )).toBe(
      'https://firefox-source-docs.mozilla.org/devtools-user/performance/' +
      'index.html'
    );
  });

  test('does not override localized internal redirect sources', () => {
    expect(resolveOfficialExternalRedirect(
      'https://developer.mozilla.org/es/docs/MDN/Kuma',
      'developer.mozilla.org',
      true
    )).toBeUndefined();
  });

  test('does not resolve unknown paths or other hosts', () => {
    expect(resolveOfficialExternalRedirect(
      'https://developer.mozilla.org/en-US/docs/Web/API/AbortController'
    )).toBeUndefined();
    expect(resolveOfficialExternalRedirect(
      'https://example.com/en-US/docs/Tools/Memory'
    )).toBeUndefined();
  });

  test('replaces the link with the external target and discards download', () => {
    const url = 'https://developer.mozilla.org/en-US/docs/Tools/Memory';
    const res = resource(url);
    const savePath = res.savePath;

    processOfficialExternalRedirect(res, null, null, opt('en-US'));

    expect(res.savePath).toBe(savePath);
    expect(res.replacePath).toBe(
      'https://firefox-source-docs.mozilla.org/devtools-user/memory/' +
      'index.html'
    );
    expect(res.shouldBeDiscardedFromDownload).toBe(true);
    expect(res.body).toBeUndefined();
    expect(res.meta.mdnOfficialExternalRedirect).toEqual({
      matchedUrl: url,
      target:
        'https://firefox-source-docs.mozilla.org/devtools-user/memory/' +
        'index.html'
    });
  });

  test('leaves ordinary MDN resources unchanged', () => {
    const res = resource(
      'https://developer.mozilla.org/en-US/docs/Web/API/AbortController'
    );
    processOfficialExternalRedirect(res, null, null, opt('en-US'));
    expect(res.body).toBeUndefined();
    expect(res.meta.mdnOfficialExternalRedirect).toBeUndefined();
  });
});
