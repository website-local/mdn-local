import type * as BCD from './types.js';
import {FeatureRow} from './feature-row.js';
import {Headers} from './headers.js';
import {Legend} from './legend.js';
import {listFeatures} from './utils.js';

// Note! Don't import any SCSS here inside *this* component.
// It's done in the component that lazy-loads this component.

export const HIDDEN_BROWSERS = ['ie'];

/**
 * Return a list of platforms and browsers that are relevant for this category &
 * data.
 *
 * If the category is "webextensions", only those are shown. In all other cases
 * at least the entirety of the "desktop" and "mobile" platforms are shown. If
 * the category is JavaScript, the entirety of the "server" category is also
 * shown. In all other categories, if compat data has info about Deno / Node.js
 * those are also shown. Deno is always shown if Node.js is shown.
 */
function gatherPlatformsAndBrowsers(
  category: string,
  data: BCD.Identifier,
  browserInfo: BCD.Browsers
): [string[], BCD.BrowserName[]] {
  const hasNodeJSData = data.__compat && 'nodejs' in data.__compat.support;
  const hasDenoData = data.__compat && 'deno' in data.__compat.support;

  const platforms = ['desktop', 'mobile'];
  if (category === 'javascript' || hasNodeJSData || hasDenoData) {
    platforms.push('server');
  }

  let browsers: BCD.BrowserName[] = [];

  // Add browsers in platform order to align table cells
  for (const platform of platforms) {
    browsers.push(
      ...(Object.keys(browserInfo).filter(
        (browser) => browserInfo[
          browser as keyof typeof browserInfo].type === platform
      ) as BCD.BrowserName[])
    );
  }

  // Filter WebExtension browsers in corresponding tables.
  if (category === 'webextensions') {
    browsers = browsers.filter(
      (browser) => browserInfo[browser].accepts_webextensions
    );
  }

  // If there is no Node.js data for a category outside of "javascript", don't
  // show it. It ended up in the browser list because there is data for Deno.
  if (category !== 'javascript' && !hasNodeJSData) {
    browsers = browsers.filter((browser) => browser !== 'nodejs');
  }

  // Hide Internet Explorer compatibility data
  browsers = browsers.filter((browser) => !HIDDEN_BROWSERS.includes(browser));

  return [platforms, [...browsers]];
}

// type CellIndex = [number, number];

function FeatureListAccordion({
  browserInfo,
  features,
  browsers,
  locale,
}: {
  browserInfo: BCD.Browsers;
  features: ReturnType<typeof listFeatures>;
  browsers: BCD.BrowserName[];
  locale: string;
}) {
  return features.map((feature, i) =>
    FeatureRow({
      browserInfo, feature, browsers, index: i,
      locale
    })).join('');
}

export default function BrowserCompatibilityTable({
  query,
  data,
  browsers: browserInfo,
  locale,
}: {
  query: string;
  data: BCD.Identifier;
  browsers: BCD.Browsers;
  locale: string;
}): string {

  if (!data || !Object.keys(data).length) {
    throw new Error(
      'BrowserCompatibilityTable component called with empty data'
    );
  }

  const breadcrumbs = query.split('.');
  const category = breadcrumbs[0];
  const name = breadcrumbs[breadcrumbs.length - 1];

  const [platforms, browsers] = gatherPlatformsAndBrowsers(
    category,
    data,
    browserInfo
  );

  return `<figure class="table-container">
          <figure class="table-container-inner">
            <table key="bc-table" class="bc-table bc-table-web">
        ${Headers({platforms, browsers, browserInfo})}
          <tbody>
          ${FeatureListAccordion({
    browserInfo,
    browsers,
    features: listFeatures(data, '', name),
    locale
  })}
          </tbody>
        </table>
        </figure>
      </figure>
      ${Legend({compat: data, name, browserInfo})}`;
}

/// region mdn-local helpers

export type YariCompatibilityDataJson =
  Parameters<typeof BrowserCompatibilityTable>[0];

export function renderYariCompatibilityTable(json: YariCompatibilityDataJson): string {
  return BrowserCompatibilityTable(json);
}

/// endregion mdn-local helpers
