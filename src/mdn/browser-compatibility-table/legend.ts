import type * as BCD from './types.js';
import {HIDDEN_BROWSERS} from './index.js';
import {
  asList,
  getFirst,
  hasMore,
  hasNoteworthyNotes,
  listFeatures,
  versionIsPreview,
} from './utils.js';

// Also specifies the order in which the legend appears
export const LEGEND_LABELS = {
  yes: 'Full support',
  partial: 'Partial support',
  preview: 'In development. Supported in a pre-release version.',
  no: 'No support',
  unknown: 'Compatibility unknown',
  experimental: 'Experimental. Expect behavior to change in the future.',
  nonstandard: 'Non-standard. Check cross-browser support before using.',
  deprecated: 'Deprecated. Not for use in new websites.',
  footnote: 'See implementation notes.',
  disabled: 'User must explicitly enable this feature.',
  altname: 'Uses a non-standard name.',
  prefix: 'Requires a vendor prefix or different name for use.',
  more: 'Has more compatibility info.',
};
type LEGEND_KEY = keyof typeof LEGEND_LABELS;

function getActiveLegendItems(
  compat: BCD.Identifier,
  name: string,
  browserInfo: BCD.Browsers
) {
  const legendItems = new Set<LEGEND_KEY>();

  for (const feature of listFeatures(compat, '', name)) {
    const { status } = feature.compat;

    if (status) {
      if (status.experimental) {
        legendItems.add('experimental');
      }
      if (status.deprecated) {
        legendItems.add('deprecated');
      }
      if (!status.standard_track) {
        legendItems.add('nonstandard');
      }
    }

    for (const [browser, browserSupport] of Object.entries(
      feature.compat.support
    )) {
      if (HIDDEN_BROWSERS.includes(browser)) {
        continue;
      }
      if (!browserSupport) {
        legendItems.add('no');
        continue;
      }
      const firstSupportItem = getFirst(browserSupport);
      if (hasNoteworthyNotes(firstSupportItem)) {
        legendItems.add('footnote');
      }

      for (const versionSupport of asList(browserSupport)) {
        if (versionSupport.version_added) {
          if (versionSupport.flags && versionSupport.flags.length) {
            legendItems.add('no');
          } else if (
            versionIsPreview(versionSupport.version_added, browserInfo[browser as BCD.BrowserName])
          ) {
            legendItems.add('preview');
          } else {
            legendItems.add('yes');
          }
        } else if (versionSupport.version_added == null) {
          legendItems.add('unknown');
        } else {
          legendItems.add('no');
        }

        if (versionSupport.partial_implementation) {
          legendItems.add('partial');
        }
        if (versionSupport.prefix) {
          legendItems.add('prefix');
        }
        if (versionSupport.alternative_name) {
          legendItems.add('altname');
        }
        if (versionSupport.flags) {
          legendItems.add('disabled');
        }
      }
      if (hasMore(browserSupport)) {
        legendItems.add('more');
      }
    }
  }
  return Object.keys(LEGEND_LABELS)
    .filter((key) => legendItems.has(key as LEGEND_KEY))
    .map((key) => [key, LEGEND_LABELS[key as LEGEND_KEY]]);
}

export function Legend({
  compat,
  name,
  browserInfo,
}: {
  compat: BCD.Identifier;
  name: string;
  browserInfo: BCD.Browsers
}): string {
  return (
    `<section class="bc-legend">
      <h3 class="visually-hidden" id="Legend">
        Legend
      </h3>
      <p class="bc-legend-tip">
        Tip: you can click/tap on a cell for more information.
      </p>
      <dl class="bc-legend-items-container">
        ${getActiveLegendItems(compat, name, browserInfo).map(([key, label]) =>
      ['yes', 'partial', 'no', 'unknown', 'preview'].includes(key) ? (
        `<div class="bc-legend-item" key="${key}">
           <dt class="bc-legend-item-dt" key="${key}">
             <span class="bc-supports-${key} bc-supports">
               <abbr class="bc-level bc-level-${key} icon icon-${key}" title="${label}">
                 <span class="visually-hidden">${label}</span>
               </abbr>
             </span>
           </dt>
           <dd class="bc-legend-item-dd">${label}</dd>
         </div>`
      ) : (
        `<div class="bc-legend-item" key="${key}">
           <dt class="bc-legend-item-dt" key="${key}">
             <abbr class="legend-icons icon icon-${key}"
               title="${label}"></abbr>
           </dt>
           <dd class="bc-legend-item-dd">${label}</dd>
         </div>`
      )
    ).join('')}
      </dl>
    </section>`
  );
}
