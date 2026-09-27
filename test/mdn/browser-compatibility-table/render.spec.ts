import {describe, expect, test} from '@jest/globals';
import {load} from 'cheerio';
import {renderCompatibilityTable} from '../../../src/mdn/browser-compatibility-table/index.js';
import {changeDocsLocale, isCurrentPageLink} from '../../../src/mdn/browser-compatibility-table/utils.js';
import type {Browsers, Identifier, VersionValue} from '../../../src/mdn/browser-compatibility-table/types.js';

const browsers = {
  chrome: {name: 'Chrome', type: 'desktop', releases: {'1': {status: 'current'}}},
  firefox: {name: 'Firefox', type: 'desktop', releases: {'1': {status: 'current'}}},
  ie: {name: 'Internet Explorer', type: 'desktop', releases: {'11': {status: 'retired'}}},
  oculus: {name: 'Meta Quest Browser', type: 'xr', releases: {}},
  nodejs: {name: 'Node.js', type: 'server', releases: {}},
} as Browsers;

function feature(url?: string): Identifier {
  const result: Identifier = {};
  result.__compat = {mdn_url: url, support: {chrome: {version_added: '1'}, ie: {version_added: '11'}}};
  return result;
}

describe('static compatibility tables', () => {
  test('renders optional columns offline but only displays default browsers', () => {
    const $ = load(renderCompatibilityTable({data: feature(), browsers}, 'css.properties.foo', 'en-US'));
    expect($('.bc-browser:not([hidden])').map((_, el) => $(el).attr('data-browser')).get())
      .toEqual(['chrome', 'firefox']);
    expect($('.bc-browser-ie[hidden]')).toHaveLength(2);
    expect($('.bc-browser-oculus[hidden]')).toHaveLength(2);
    expect($('.bc-browser-nodejs')).toHaveLength(0);
    expect($('.bc-platform:not([hidden])').map((_, el) => $(el).attr('data-platform')).get())
      .toEqual(['desktop']);
    expect($('.bc-platform-xr').attr('hidden')).toBeDefined();
    expect($('.bc-settings input[name="ie"]').attr('data-default')).toBe('false');
    expect($('.bc-settings input[name="chrome"]').attr('checked')).toBeDefined();
    expect($('.bc-settings input[name="nodejs"]').parent().text()).toContain('No support data');
    expect($('.bc-settings').attr('hidden')).toBeDefined();
    expect($('.bc-table').attr('style')).toContain('--compat-table-browser-count: 2');
    expect($('.bc-browser-ie .icon-browser')).toHaveLength(1);
  });

  test('omits links to this page across locales, preserving fragment and other-page links', () => {
    const data = feature();
    data.same = feature('https://developer.mozilla.org/en-US/docs/Web/CSS/foo');
    data.section = feature('https://developer.mozilla.org/en-US/docs/Web/CSS/foo#syntax');
    data.other = feature('https://developer.mozilla.org/en-US/docs/Web/CSS/bar');
    const $ = load(renderCompatibilityTable({data, browsers}, 'css.properties.foo', 'zh-CN', '/zh-CN/docs/Web/CSS/foo'));
    const links = $('a.bc-table-row-header').map((_, el) => $(el).attr('href')).get();
    expect(links).toEqual([
      'https://developer.mozilla.org/zh-CN/docs/Web/CSS/foo#syntax',
      'https://developer.mozilla.org/zh-CN/docs/Web/CSS/bar',
    ]);
    expect($('.bc-feature div.bc-table-row-header').text()).toContain('same');
  });

  test.each([
    {browser: 'chrome', version: '1'},
    {browser: 'ie', version: '11'},
  ] as const)('preserves the complete release-date tooltip for $browser', ({browser, version}) => {
    const data = feature();
    data.__compat!.support[browser] = {version_added: version, release_date: '2026-01-15'};
    const $ = load(renderCompatibilityTable({data, browsers}, 'css.properties.foo', 'en-US'));
    const cell = $(`td.bc-browser-${browser}`);

    expect(cell.find('.bcd-cell-text-wrapper .bc-version-label').attr('title'))
      .toBe(`${browsers[browser].name} ${version} – Release date: 2026-01-15`);
    expect(cell.find('.timeline .bc-version-label').attr('title')).toBe('');
    expect(cell.find('.timeline .bc-version-label').text()).toContain('(Release date: 2026-01-15)');
  });

  test.each<[VersionValue, string | undefined, string]>([
    ['1', '10', 'From version 1 until 10, users'],
    ['1', undefined, 'From version 1, users'],
    [true, '10', 'Until 10, users'],
    ['preview', undefined, 'Users'],
  ])('renders flag instructions for %s through %s', (version_added, version_last, prefix) => {
    const data = feature();
    data.__compat!.support.chrome = {
      version_added, version_last,
      flags: [{type: 'preference', name: 'example.enabled', value_to_set: 'true'}],
    };
    const $ = load(renderCompatibilityTable({data, browsers}, 'css.properties.foo', 'en-US'));
    expect($('.bc-browser-chrome .bc-notes-list').text().replace(/\s+/g, ' '))
      .toContain(`${prefix} must explicitly set the example.enabled preference to true.`);
  });
});

describe('BCD link normalization', () => {
  test.each([
    ['https://developer.mozilla.org/en-US/docs/Web/CSS/foo', true],
    ['/en-US/docs/Web/CSS/foo?plain=1', true],
    ['/en-US/docs/Web/CSS/bar', false],
    ['/en-US/docs/Web/CSS/foo/', false],
    ['/en-US/docs/Web/CSS/foo#syntax', false],
    ['#syntax', false],
    ['https://example.com/en-US/docs/Web/CSS/foo', false],
  ])('matches %s to a translated document: %s', (url, expected) => {
    expect(isCurrentPageLink(url, '/fr/docs/Web/CSS/foo')).toBe(expected);
  });

  test('normalizes locale-less paths without changing non-document links', () => {
    expect(changeDocsLocale('/docs/Web/CSS/foo#syntax', 'fr')).toBe('/fr/docs/Web/CSS/foo#syntax');
    expect(changeDocsLocale('/en-US/play', 'fr')).toBe('/en-US/play');
  });
});
