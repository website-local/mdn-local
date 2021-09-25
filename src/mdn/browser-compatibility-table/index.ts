import type * as bcd from './types';
import { FeatureRow } from './feature-row';
import { Headers, PLATFORM_BROWSERS } from './headers';
import { Legend } from './legend';
import { listFeatures } from './utils';

// Note! Don't import any SCSS here inside *this* component.
// It's done in the component that lazy-loads this component.

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
  data: bcd.Identifier
): [string[], bcd.BrowserNames[]] {
  const hasNodeJSData = data.__compat && 'nodejs' in data.__compat.support;
  const hasDenoData = data.__compat && 'deno' in data.__compat.support;

  let platforms = ['desktop', 'mobile'];
  if (category === 'javascript' || hasNodeJSData || hasDenoData) {
    platforms.push('server');
  } else if (category === 'webextensions') {
    platforms = ['webextensions-desktop', 'webextensions-mobile'];
  }

  const browsers = new Set(
    platforms.map((platform) => PLATFORM_BROWSERS[platform] || []).flat()
  );

  // If there is no Node.js data for a category outside of "javascript", don't
  // show it. It ended up in the browser list because there is data for Deno.
  if (category !== 'javascript' && !hasNodeJSData) {
    browsers.delete('nodejs');
  }

  return [platforms, [...browsers]];
}


function FeatureListAccordion({
  browserInfo,
  features,
  browsers,
  locale,
}: {
  browserInfo: bcd.Browsers;
  features: ReturnType<typeof listFeatures>;
  browsers: bcd.BrowserNames[];
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
  data: bcd.Identifier;
  browsers: bcd.Browsers;
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

  const [platforms, browsers] = gatherPlatformsAndBrowsers(category, data);

  return `<table key="bc-table" class="bc-table bc-table-web">
        ${Headers({browserInfo, platforms, browsers})}
          <tbody>
          ${FeatureListAccordion({
    browserInfo,
    browsers,
    features: listFeatures(data, '', name),
    locale
  })}
          </tbody>
        </table>
        ${Legend({compat: data, name})}`;
}

/// region mdn-local helpers

export type YariCompatibilityDataJson =
  Parameters<typeof BrowserCompatibilityTable>[0];

export function renderYariCompatibilityTable(json: YariCompatibilityDataJson): string {
  return BrowserCompatibilityTable(json);
}

/// endregion mdn-local helpers
