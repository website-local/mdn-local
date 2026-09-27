import type {BrowserName, Browsers, Identifier} from './types.js';

export type BrowserVisibility = Partial<Record<BrowserName, boolean>>;
export type HiddenBrowsers = Partial<Record<BrowserName, 'no-data' | 'not-applicable'>>;

// https://github.com/mdn/fred/blob/01ae668d/components/compat-table/settings.js
export const DEFAULT_BROWSERS: readonly string[] = [
  'chrome',
  'edge',
  'firefox',
  'opera',
  'safari',
  'chrome_android',
  'firefox_android',
  'opera_android',
  'safari_ios',
  'samsunginternet_android',
  'webview_android',
  'webview_ios',
  'bun',
  'deno',
  'nodejs',
];

export function isBrowserVisible(browser: BrowserName, visibility: BrowserVisibility): boolean {
  return visibility[browser] ?? DEFAULT_BROWSERS.includes(browser);
}

// https://github.com/mdn/fred/blob/01ae668d/components/compat-table/browsers.js
export function gatherPlatformsAndBrowsers(
  category: string,
  data: Identifier,
  browserInfo: Partial<Browsers>,
  visibility: BrowserVisibility = {},
): [string[], BrowserName[], HiddenBrowsers] {
  const names = Object.keys(browserInfo) as BrowserName[];
  const runtimes = names.filter(browser => browserInfo[browser]?.type === 'server');
  let platforms = ['desktop', 'mobile'];
  if (category === 'javascript' || runtimes.some(
    runtime => data.__compat && runtime in data.__compat.support,
  )) {
    platforms.push('server');
  }
  for (const browser of names) {
    const type = browserInfo[browser]?.type;
    if (type && type !== 'server' && !platforms.includes(type) &&
      isBrowserVisible(browser, visibility)) {
      platforms.push(type);
    }
  }

  const hidden: HiddenBrowsers = {};
  if (category === 'webextensions') {
    for (const browser of names) {
      if (!browserInfo[browser]?.accepts_webextensions) {
        hidden[browser] = 'not-applicable';
      }
    }
  }
  if (category !== 'javascript') {
    for (const runtime of runtimes) {
      if (data.__compat && !(runtime in data.__compat.support)) {
        hidden[runtime] ??= 'no-data';
      }
    }
  }

  const browsers = platforms.flatMap(platform => names.filter(browser =>
    browserInfo[browser]?.type === platform && !(browser in hidden) &&
    isBrowserVisible(browser, visibility),
  ));
  platforms = platforms.filter(platform =>
    browsers.some(browser => browserInfo[browser]?.type === platform),
  );
  return [platforms, browsers, hidden];
}
