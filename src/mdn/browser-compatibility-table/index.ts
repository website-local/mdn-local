import type * as bcd from './types';
import { FeatureRow } from './feature-row';
import { PLATFORM_BROWSERS, Headers } from './headers';
import { Legend } from './legend';
import { listFeatures } from './utils';

// Note! Don't import any SCSS here inside *this* component.
// It's done in the component that lazy-loads this component.

function gatherPlatformsAndBrowsers(
  category: string
): [string[], bcd.BrowserNames[]] {
  let platforms = ['desktop', 'mobile'];
  if (category === 'javascript') {
    platforms.push('server');
  } else if (category === 'webextensions') {
    platforms = ['webextensions-desktop', 'webextensions-mobile'];
  }
  return [
    platforms,
    platforms.map((platform) => PLATFORM_BROWSERS[platform] || []).flat(),
  ];
}

function FeatureListAccordion({
  browserInfo,
  features,
  browsers,
}: {
  browserInfo: bcd.Browsers;
  features: ReturnType<typeof listFeatures>;
  browsers: bcd.BrowserNames[];
}) {
  return features.map((feature, i) =>
    FeatureRow({
      browserInfo, feature, browsers, index: i
    })).join('');
}

export default function BrowserCompatibilityTable({
  query,
  data,
  browsers: browserInfo,
}: {
  query: string;
  data: bcd.Identifier;
  browsers: bcd.Browsers;
}): string {

  if (!data || !Object.keys(data).length) {
    throw new Error(
      'BrowserCompatibilityTable component called with empty data'
    );
  }

  const breadcrumbs = query.split('.');
  const category = breadcrumbs[0];
  const name = breadcrumbs[breadcrumbs.length - 1];

  const [platforms, browsers] = gatherPlatformsAndBrowsers(category);

  return `<table key="bc-table" class="bc-table bc-table-web">
        ${Headers({browserInfo, platforms, browsers})}
          <tbody>
          ${FeatureListAccordion({
    browserInfo,
    browsers,
    features: listFeatures(data, '', name)
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
