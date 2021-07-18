import type * as bcd from './types';
import { FeatureRow } from './feature-row';
import { PLATFORM_BROWSERS, Headers } from './headers';
import { Legend } from './legend';
import { listFeatures } from './utils';

// Note! Don't import any SCSS here inside *this* component.
// It's done in the component that lazy-loads this component.

function gatherPlatformsAndBrowsers(
  category: string,
  data: bcd.Identifier
): [string[], bcd.BrowserNames[]] {
  let platforms = ['desktop', 'mobile'];
  if (
    category === 'javascript' ||
    (data.__compat && data.__compat.support.nodejs)
  ) {
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
