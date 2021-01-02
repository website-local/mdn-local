import type * as bcd from './types';
import { BrowserName } from './browser-info';

export const PLATFORM_BROWSERS: { [key: string]: bcd.BrowserNames[] } = {
  desktop: ['chrome', 'edge', 'firefox', 'ie', 'opera', 'safari'],
  mobile: [
    'webview_android',
    'chrome_android',
    'firefox_android',
    'opera_android',
    'safari_ios',
    'samsunginternet_android',
  ],
  server: ['nodejs'],
  'webextensions-desktop': ['chrome', 'edge', 'firefox', 'opera', 'safari'],
  'webextensions-mobile': ['firefox_android'],
};

function PlatformHeaders({ platforms }: { platforms: string[] }) {
  return (
    `<tr class="bc-platforms">
      <td></td>
      ${platforms.map((platform) => {
      const platformCount = Object.keys(PLATFORM_BROWSERS[platform]).length;
      const platformId = platform.replace('webextensions-', '');
      return (
        `<th key="${platform}" class="bc-platform-${platformId}"
            colSpan="${platformCount}">
            <span>${platform}</span>
          </th>`
      );
    }).join('')}
    </tr>`
  );
}

function BrowserHeaders({ browserInfo, browsers }: {
  browserInfo: bcd.Browsers,
  browsers: bcd.BrowserNames[]
}) {
  return (
    `<tr class="bc-browsers">
      <td></td>
      ${browsers.map((browser) => (
      `<th key="${browser}" class="bc-browser-${browser}">
         <span class="bc-head-txt-label bc-head-icon-${browser}">
           ${BrowserName({browserInfo, id: browser})}
         </span>
       </th>`
    )).join('')}
    </tr>`
  );
}

export function Headers({ browserInfo, platforms, browsers }: {
  browserInfo: bcd.Browsers;
  browsers: bcd.BrowserNames[];
  platforms: string[]
}): string {
  return (
    `<thead>
      ${PlatformHeaders({platforms})}
      ${BrowserHeaders({browserInfo, browsers})}
    </thead>`
  );
}
