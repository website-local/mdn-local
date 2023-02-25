/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type * as BCD from './types';
import {
  asList,
  getCurrentSupport,
  hasMore,
  hasNoteworthyNotes,
  isFullySupportedWithoutLimitation,
  isNotSupportedAtAll,
  isTruthy,
  versionIsPreview,
  SupportStatementExtended,
} from './utils';
import { LEGEND_LABELS } from './legend';

function getSupportClassName(
  support: SupportStatementExtended | undefined,
  browser: BCD.BrowserStatement
): 'no' | 'yes' | 'partial' | 'preview' | 'removed-partial' | 'unknown' {
  if (!support) {
    return 'unknown';
  }

  const { flags, version_added, version_removed, partial_implementation } =
    getCurrentSupport(support)!;

  let className: ReturnType<typeof getSupportClassName>;
  if (version_added === null) {
    className = 'unknown';
  } else if (versionIsPreview(version_added, browser)) {
    className = 'preview';
  } else if (version_added) {
    className = 'yes';
    if (version_removed || (flags && flags.length)) {
      className = 'no';
    }
  } else {
    className = 'no';
  }
  if (partial_implementation) {
    className = version_removed ? 'removed-partial' : 'partial';
  }

  return className;
}

function getSupportBrowserReleaseDate(
  support: SupportStatementExtended | undefined
): string | undefined {
  if (!support) {
    return undefined;
  }
  return getCurrentSupport(support)!.release_date;
}

function StatusIcons({ status }: { status: BCD.StatusBlock }) {
  const icons = [
    status.experimental && {
      title: 'Experimental. Expect behavior to change in the future.',
      text: 'Experimental',
      iconClassName: 'icon-experimental',
    },
    status.deprecated && {
      title: 'Deprecated. Not for use in new websites.',
      text: 'Deprecated',
      iconClassName: 'icon-deprecated',
    },
    !status.standard_track && {
      title: 'Non-standard. Expect poor cross-browser support.',
      text: 'Non-standard',
      iconClassName: 'icon-nonstandard',
    },
  ].filter(isTruthy);

  return icons.length === 0 ? '' : (
    `<div class="bc-icons" data-test="${icons.length}">
      ${icons.map((icon) =>
      (`<abbr key="${icon.iconClassName}" class="only-icon icon ${icon.iconClassName}" title="${icon.title}">
          <span>${icon.text}</span>
        </abbr>`)).join('')}
    </div>`
  );
}

function labelFromString(
  version: string | boolean | null | undefined,
  browser: BCD.BrowserStatement,
) {
  if (typeof version !== 'string') {
    return '?';
  }
  // Treat BCD ranges as exact versions to avoid confusion for the reader
  // See https://github.com/mdn/yari/issues/3238
  if (version.startsWith('≤')) {
    return version.slice(1);
  }
  if (version === 'preview') {
    return browser.preview_name;
  }
  return version;
}

function versionLabelFromSupport(
  added: string | boolean | null | undefined,
  removed: string | boolean | null | undefined,
  browser: BCD.BrowserStatement
) {
  if (typeof removed !== 'string') {
    return labelFromString(added, browser);
  }
  return (`${labelFromString(added, browser)}&#8202;&ndash;&#8202;
  ${labelFromString(removed, browser)}`);
}

const CellText =({
  support,
  browser,
  timeline = false,
}: {
  support: BCD.SupportStatement | undefined;
  browser: BCD.BrowserStatement;
  timeline?: boolean;
}): string => {

  const currentSupport = getCurrentSupport(support);

  const added = currentSupport?.version_added ?? null;
  const lastVersion = currentSupport?.version_last ?? null;

  const browserReleaseDate = getSupportBrowserReleaseDate(support);
  const supportClassName = getSupportClassName(support, browser);

  let status:
    | { isSupported: 'unknown' }
    | {
    isSupported: 'no' | 'yes' | 'partial' | 'preview' | 'removed-partial';
    label?: string;
  };
  switch (added) {
  case null:
    status = { isSupported: 'unknown' };
    break;
  case true:
    status = { isSupported: lastVersion ? 'no' : 'yes' };
    break;
  case false:
    status = { isSupported: 'no' };
    break;
  case 'preview':
    status = { isSupported: 'preview' };
    break;
  default:
    status = {
      isSupported: supportClassName,
      label: versionLabelFromSupport(added, lastVersion, browser),
    };
    break;
  }

  let label: string | undefined;
  let title = '';
  switch (status.isSupported) {
  case 'yes':
    title = 'Full support';
    label = status.label || 'Yes';
    break;

  case 'partial':
    title = 'Partial support';
    label = status.label || 'Partial';
    break;

  case 'removed-partial':
    if (timeline) {
      title = 'Partial support';
      label = status.label || 'Partial';
    } else {
      title = 'No support';
      label = status.label || 'No';
    }
    break;

  case 'no':
    title = 'No support';
    label = status.label || 'No';
    break;

  case 'preview':
    title = 'Preview browser support';
    label = status.label || browser.preview_name;
    break;

  case 'unknown':
    title = 'Compatibility unknown; please update this.';
    label = '?';
    break;
  }

  return (`<div class="${
    timeline ? 'bcd-timeline-cell-text-wrapper' : 'bcd-cell-text-wrapper'
  }">
        <div class="bcd-cell-icons">
          <span class="icon-wrap">
            <abbr
              class="bc-level-${supportClassName} icon icon-${supportClassName}"
              title="${title}"
            >
              <span class="bc-support-level">${title}</span>
            </abbr>
          </span>
        </div>
        <div class="bcd-cell-text-copy">
          <span class="bc-browser-name">{browser.name}</span>
          <span
            class="bc-version-label"
            title=${
    browserReleaseDate && !timeline
      ? `Released ${browserReleaseDate}`
      : undefined
    }>
            ${label}
            ${browserReleaseDate && timeline
      ? ` (Released ${browserReleaseDate})`
      : ''}
          </span>
        </div>
        ${CellIcons({support})}
      </div>`);
};

function Icon({ name }: { name: string }) {
  const title = LEGEND_LABELS[name as keyof typeof LEGEND_LABELS] ?? name;

  return (
    `<abbr class="only-icon" title="${title}">
    <span>${name}</span>
    <i class"icon icon-${name}" />
  </abbr>`);
}

function CellIcons({ support }: { support: BCD.SupportStatement | undefined }) {
  const supportItem = getCurrentSupport(support);
  if (!supportItem) {
    return null;
  }

  const icons = [
    // TODO: key?
    supportItem.prefix && Icon({name: 'prefix'}),
    hasNoteworthyNotes(supportItem) && Icon({name: 'footnote'}),
    supportItem.alternative_name && Icon({name: 'altname'}),
    supportItem.flags && Icon({name: 'disabled'}),
    hasMore(support) && Icon({name: 'more'}),
  ].filter(Boolean);

  return icons.length ? `<div class="bc-icons">${icons.join('')}</div>` : '';
}

function FlagsNote({
  supportItem,
  browser,
}: {
  supportItem: BCD.SimpleSupportStatement;
  browser: BCD.BrowserStatement;
}) {
  const hasAddedVersion = typeof supportItem.version_added === 'string';
  const hasRemovedVersion = typeof supportItem.version_removed === 'string';
  const flags = supportItem.flags || [];
  return (
    `${hasAddedVersion && `From version ${supportItem.version_added}` || ''}
  ${hasRemovedVersion && (
      `${hasAddedVersion ? ' until' : 'Until'} version
    ${supportItem.version_removed} (exclusive)`) || ''}
  ${hasAddedVersion || hasRemovedVersion ? ': this' : 'This'} feature is
  behind the
  ${flags.map((flag, i) => {
      const valueToSet = flag.value_to_set &&
      (`  (needs to be set to <code>${flag.value_to_set}</code>)`) || '';
      return (`<code key="${flag.name}">${flag.name}</code>
        ${flag.type === 'preference' && `preferences${valueToSet}` || ''}
        ${flag.type === 'runtime_flag' && `runtime flag${valueToSet}` || ''}
        ${i < flags.length - 1 && ' and the ' || ''}`);
    }).join('')}.${browser.pref_url &&
  flags.some((flag) => flag.type === 'preference') &&
  ` To change preferences in ${browser.name}, visit ${browser.pref_url}.` || ''}
`);
}

function getNotes(
  browser: BCD.BrowserStatement,
  support: BCD.SupportStatement
) {
  if (!support) {
    return [''];
  }
  return asList(support)
    .slice()
    .reverse()
    .flatMap((item, i) => {

      const supportNotes = [
        item.version_removed &&
        !asList(support).some(
          (otherItem) => otherItem.version_added === item.version_removed
        )
          ? {
            iconName: 'disabled',
            label: (`Removed in ${labelFromString(item.version_removed, browser)} and later`),
          }
          : null,
        item.partial_implementation
          ? {
            iconName: 'footnote',
            label: 'Partial support',
          }
          : null,
        item.prefix
          ? {
            iconName: 'prefix',
            label: `Implemented with the vendor prefix: ${item.prefix}`,
          }
          : null,
        item.alternative_name
          ? {
            iconName: 'altname',
            label: `Alternate name: ${item.alternative_name}`,
          }
          : null,
        item.flags
          ? {
            iconName: 'disabled',
            label: FlagsNote({browser, supportItem :item}) ,
          }
          : null,
        item.notes
          ? (Array.isArray(item.notes) ? item.notes : [item.notes]).map(
            (note) => ({ iconName: 'footnote', label: note })
          )
          : null,
        versionIsPreview(item.version_added, browser)
          ? {
            iconName: 'footnote',
            label: 'Preview browser support',
          }
          : null,
        // If we encounter nothing else than the required `version_added` and
        // `release_date` properties, assume full support.
        // EDIT 1-5-21: if item.version_added doesn't exist, assume no support.
        isFullySupportedWithoutLimitation(item) &&
        !versionIsPreview(item.version_added, browser)
          ? {
            iconName: 'footnote',
            label: 'Full support',
          }
          : isNotSupportedAtAll(item)
            ? {
              iconName: 'footnote',
              label: 'No support',
            }
            : null,
      ]
        .flat()
        .filter(isTruthy);

      const hasNotes = supportNotes.length > 0;
      return ((i === 0 || hasNotes) && (
        `<div key="${i}" class="bc-notes-wrapper">
      <dt class="bc-supports-${getSupportClassName(item, browser)} bc-supports">
      ${CellText({support: item, browser, timeline: true})}
      </dt>
      ${supportNotes.map(({iconName, label}, i) => (
          `<dd class="bc-supports-dd" key="${i}">
        ${Icon({name: iconName})}
        ${typeof label === 'string' ? (
            `<span>${label}</span>`
          ) : (
            label
          )}
        </dd>`
        )).join('')}
      ${!hasNotes && '<dd></dd>' || ''}
      </div>`) || '');
    }).filter(isTruthy);
}

function CompatCell({
  browserId,
  browserInfo,
  support,
  showNotes,
  // onToggle,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  locale,
}: {
  browserId: BCD.BrowserName;
  browserInfo: BCD.BrowserStatement;
  support: BCD.SupportStatement | undefined;
  showNotes: boolean;
  // onToggle: () => void;
  locale: string;
}) {

  const supportClassName = getSupportClassName(support, browserInfo);
  // NOTE: 1-5-21, I've forced hasNotes to return true, in order to
  // make the details view open all the time.
  // Whenever the support statement is complex (array with more than one entry)
  // or if a single entry is complex (prefix, notes, etc.),
  // we need to render support details in `bc-history`
  // const hasNotes =
  //   support &&
  //   (asList(support).length > 1 ||
  //     asList(support).some(
  //       (item) =>
  //         item.prefix || item.notes || item.alternative_name || item.flags
  //     ));
  const notes = getNotes(browserInfo, support!);
  const content = (`${CellText({support, browser: browserInfo})}
  ${showNotes && (
      `<dl class="bc-notes-list bc-history bc-history-mobile bc-hidden">${notes}</dl>`
    )}
  </>
`);

  return (`<td
        class="bc-support bc-browser-${browserId} bc-supports-${supportClassName} ${
      notes ? 'bc-has-history' : ''
    }"
        aria-expanded="false"
      >
        <button type="button" disabled=${!notes} title="Toggle history">
          ${content}
          <span class="offscreen">Toggle history</span>
        </button>
      </td>`
  );
}

export const FeatureRow = ({
  browserInfo,
  index,
  feature,
  browsers,
  // activeCell,
  // onToggleCell,
  locale,
}: {
  browserInfo: BCD.Browsers;
  index: number;
  feature: {
    name: string;
    compat: BCD.CompatStatement;
    depth: number;
  };
  browsers: BCD.BrowserName[];
  // activeCell: number | null;
  // onToggleCell: ([row, column]: [number, number]) => void;
  locale: string;
}): string => {
  const { name, compat, depth } = feature;
  const title = compat.description ? (
    `<span>${compat.description}</span>`
  ) : (
    `<code>${name}</code>`
  );

  // const activeBrowser = activeCell !== null ? browsers[activeCell] : null;

  let titleNode: string;

  if (compat.mdn_url && depth > 0) {
    titleNode = (
      `<a href={compat.mdn_url} class="bc-table-row-header">
        ${title}
        ${compat.status && StatusIcons( {status: compat.status}) || ''}
      </a>`
    );
  } else {
    titleNode = (
      `<div class="bc-table-row-header">
        ${title}
        ${compat.status && StatusIcons( {status: compat.status}) || ''}
      </div>`
    );
  }

  return (`<tr class="bc-content-row" key="${index}">
          <th class="bc-feature bc-feature-depth-${depth}" scope="row">${titleNode}</th>
    ${browsers.map((browser) => (
      CompatCell({
        // key: browser,
        browserId: browser,
        browserInfo: browserInfo[browser],
        support: compat.support[browser],
        showNotes: true,
        locale
      })
    )).join('')}
    </tr>
    <tr class="bc-history bc-history-desktop bc-hidden">
      <td colSpan=${browsers.length + 1}>
        <dl class="bc-notes-list"></dl>
      </td>
    </tr>`);
};
