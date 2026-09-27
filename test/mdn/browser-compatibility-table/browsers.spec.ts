import {describe, expect, test} from '@jest/globals';
import {gatherPlatformsAndBrowsers} from '../../../src/mdn/browser-compatibility-table/browsers.js';
import type {BrowserVisibility} from '../../../src/mdn/browser-compatibility-table/browsers.js';
import type {BrowserStatement, Browsers, BrowserType, Identifier} from '../../../src/mdn/browser-compatibility-table/types.js';

function browser(type: BrowserType, accepts_webextensions = false): BrowserStatement {
  return {name: type, type, accepts_webextensions, accepts_flags: false, releases: {}};
}

const browserInfo: Partial<Browsers> = {
  chrome: browser('desktop', true),
  firefox: browser('desktop', true),
  ie: browser('desktop'),
  chrome_android: browser('mobile'),
  deno: browser('server'),
  nodejs: browser('server'),
  oculus: browser('xr'),
};
const data: Identifier = {};
data.__compat = {support: {chrome: {version_added: '1'}}};

describe('compatibility browser selection', () => {
  test('defaults omit non-default browsers and runtimes without data', () => {
    expect(gatherPlatformsAndBrowsers('css', data, browserInfo)).toEqual([
      ['desktop', 'mobile'], ['chrome', 'firefox', 'chrome_android'],
      {deno: 'no-data', nodejs: 'no-data'},
    ]);
  });

  test('includes server runtimes with data outside JavaScript', () => {
    const api: Identifier = {};
    api.__compat = {support: {nodejs: {version_added: '18'}}};
    expect(gatherPlatformsAndBrowsers('api', api, browserInfo)).toEqual([
      ['desktop', 'mobile', 'server'], ['chrome', 'firefox', 'chrome_android', 'nodejs'],
      {deno: 'no-data'},
    ]);
  });

  test('includes all server runtimes for JavaScript', () => {
    expect(gatherPlatformsAndBrowsers('javascript', data, browserInfo)).toEqual([
      ['desktop', 'mobile', 'server'], ['chrome', 'firefox', 'chrome_android', 'deno', 'nodejs'], {},
    ]);
  });

  test('keeps WebExtensions exclusions even when users select those browsers', () => {
    const [platforms, browsers, hidden] = gatherPlatformsAndBrowsers(
      'webextensions', data, browserInfo, {nodejs: true, oculus: true},
    );
    expect(platforms).toEqual(['desktop']);
    expect(browsers).toEqual(['chrome', 'firefox']);
    expect(hidden).toEqual({
      ie: 'not-applicable', chrome_android: 'not-applicable', deno: 'not-applicable',
      nodejs: 'not-applicable', oculus: 'not-applicable',
    });
  });

  test.each<{
    visibility: BrowserVisibility;
    platforms: string[];
    browsers: string[];
  }>([
    {visibility: {ie: true}, platforms: ['desktop', 'mobile'], browsers: ['chrome', 'firefox', 'ie', 'chrome_android']},
    {visibility: {oculus: true}, platforms: ['desktop', 'mobile', 'xr'], browsers: ['chrome', 'firefox', 'chrome_android', 'oculus']},
    {visibility: {chrome_android: false}, platforms: ['desktop'], browsers: ['chrome', 'firefox']},
    {visibility: {nodejs: true}, platforms: ['desktop', 'mobile'], browsers: ['chrome', 'firefox', 'chrome_android']},
    {visibility: {chrome: false, firefox: false, chrome_android: false}, platforms: [], browsers: []},
  ])('applies $visibility and removes empty platform headers', ({visibility, platforms, browsers}) => {
    const actual = gatherPlatformsAndBrowsers('css', data, browserInfo, visibility);
    expect(actual.slice(0, 2)).toEqual([platforms, browsers]);
  });
});
