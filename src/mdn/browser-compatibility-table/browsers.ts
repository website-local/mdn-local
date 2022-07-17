import type * as BCD from './types';

export const browsers: BCD.Browsers = {
  'chrome': {
    'accepts_flags': true,
    'accepts_webextensions': true,
    'name': 'Chrome',
    'pref_url': 'chrome://flags',
    'preview_name': 'Canary',
    'releases': [],
    'type': 'desktop'
  },
  'chrome_android': {
    'accepts_flags': true,
    'accepts_webextensions': false,
    'name': 'Chrome Android',
    'pref_url': 'chrome://flags',
    'releases': [],
    'type': 'mobile',
    'upstream': 'chrome'
  },
  'deno': {
    'accepts_flags': true,
    'accepts_webextensions': false,
    'name': 'Deno',
    'releases': [],
    'type': 'server'
  },
  'edge': {
    'accepts_flags': true,
    'accepts_webextensions': true,
    'name': 'Edge',
    'pref_url': 'about:flags',
    'releases': [],
    'type': 'desktop',
    'upstream': 'chrome'
  },
  'firefox': {
    'accepts_flags': true,
    'accepts_webextensions': true,
    'name': 'Firefox',
    'pref_url': 'about:config',
    'preview_name': 'Nightly',
    'releases': [],
    'type': 'desktop'
  },
  'firefox_android': {
    'accepts_flags': false,
    'accepts_webextensions': true,
    'name': 'Firefox for Android',
    'pref_url': 'about:config',
    'releases': [],
    'type': 'mobile',
    'upstream': 'firefox'
  },
  'ie': {
    'accepts_flags': false,
    'accepts_webextensions': false,
    'name': 'Internet Explorer',
    'releases': [],
    'type': 'desktop'
  },
  'nodejs': {
    'accepts_flags': true,
    'accepts_webextensions': false,
    'name': 'Node.js',
    'releases': [],
    'type': 'server'
  },
  'oculus': {
    'accepts_flags': true,
    'accepts_webextensions': false,
    'name': 'Oculus Browser',
    'pref_url': 'chrome://flags',
    'releases': [],
    'type': 'xr',
    'upstream': 'chrome_android'
  },
  'opera': {
    'accepts_flags': true,
    'accepts_webextensions': true,
    'name': 'Opera',
    'pref_url': 'opera://flags',
    'releases': [],
    'type': 'desktop',
    'upstream': 'chrome'
  },
  'opera_android': {
    'accepts_flags': false,
    'accepts_webextensions': false,
    'name': 'Opera Android',
    'releases': [],
    'type': 'mobile',
    'upstream': 'chrome_android'
  },
  'safari': {
    'accepts_flags': true,
    'accepts_webextensions': true,
    'name': 'Safari',
    'preview_name': 'TP',
    'releases': [],
    'type': 'desktop'
  },
  'safari_ios': {
    'accepts_flags': true,
    'accepts_webextensions': true,
    'name': 'Safari on iOS',
    'releases': [],
    'type': 'mobile',
    'upstream': 'safari'
  },
  'samsunginternet_android': {
    'accepts_flags': false,
    'accepts_webextensions': false,
    'name': 'Samsung Internet',
    'releases': [],
    'type': 'mobile',
    'upstream': 'chrome_android'
  },
  'webview_android': {
    'accepts_flags': false,
    'accepts_webextensions': false,
    'name': 'WebView Android',
    'releases': [],
    'type': 'mobile',
    'upstream': 'chrome_android'
  }
} as unknown as BCD.Browsers;
