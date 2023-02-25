import type * as BCD from './types';
import { BrowserName } from './browser-info';

function PlatformHeaders({
  platforms,
  browsers,
  browserInfo,
}: {
  platforms: string[];
  browsers: BCD.BrowserName[];
  browserInfo: BCD.Browsers;
}) {
  return (
    `<tr class="bc-platforms">
      <td></td>
      ${platforms.map((platform) => {
      // Get the intersection of browsers in the `browsers` array and the
      // `PLATFORM_BROWSERS[platform]`.
      const browsersInPlatform = browsers.filter(
        (browser) => browserInfo[browser].type === platform
      );
      const browserCount = browsersInPlatform.length;
      const platformId = platform.replace('webextensions-', '');
      return (
        `<th key="${platform}" class="bc-platform-${platformId}"
            colSpan="${browserCount}"
            title=${platform}>
            <span class="icon icon-${platform}"></span>
            <span class="visually-hidden">${platform}</span>
          </th>`
      );
    }).join('')}
    </tr>`
  );
}

function BrowserHeaders({ browserInfo, browsers }: {
  browserInfo: BCD.Browsers,
  browsers: BCD.BrowserName[]
}) {
  return (
    `<tr class="bc-browsers">
      <td></td>
      ${browsers.map((browser) => {
      return (
        `<th key="${browser}" class="bc-browser bc-browser-${browser}">
         <div class="bc-head-txt-label bc-head-icon-${browser}">
           ${BrowserName({browserInfo, id: browser})}
         </div>
         <div class="bc-head-icon-symbol icon icon-${browserToIconName(
          browser
        )}"></div>
       </th>`
      );
    }).join('')}
    </tr>`
  );
}

export function browserToIconName(browser: string) {
  const browserStart = browser.split('_')[0];
  return browserStart === 'firefox' ? 'simple-firefox' : browserStart;
}

export function Headers({
  platforms,
  browsers,
  browserInfo,
}: {
  platforms: string[];
  browsers: BCD.BrowserName[];
  browserInfo: BCD.Browsers;
}): string {
  return (
    `<thead>
      ${PlatformHeaders({platforms, browsers, browserInfo})}
      ${BrowserHeaders({browserInfo, browsers})}
    </thead>`
  );
}
