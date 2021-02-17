import type * as bcd from './types';
import { BrowserName } from './browser-info';
import { asList, getFirst, isTruthy } from './utils';

// Yari builder will attach extra keys from the compat data
// it gets from @mdn/browser-compat-data. These are "Yari'esque"
// extras that helps us avoiding to have a separate data structure.
interface CompatStatementExtended extends bcd.CompatStatement {
  // When a compat statement has a .mdn_url but it's actually not a good
  // one, the Yari builder will attach an extra boolean that indicates
  // that it's not a valid link.
  // Note, it's only 'true' if it's present, hence this interface definition.
  bad_url?: true;
}

// Extended for the fields, beyond the bcd types, that are extra-added
// exclusively in Yari.
interface SimpleSupportStatementExtended extends bcd.SimpleSupportStatement {
  // Known for some support statements where the browser *version* is known,
  // as opposed to just "true" and if the version release date is known.
  release_date?: string;
}

type SupportStatementExtended =
  | SimpleSupportStatementExtended
  | SimpleSupportStatementExtended[];

function getSupportClassName(
  support: SupportStatementExtended | undefined
): string {
  if (!support) {
    return 'unknown';
  }

  const {
    flags,
    version_added,
    version_removed,
    partial_implementation,
  } = getFirst(support);


  let className;
  if (version_added === null) {
    className = 'unknown';
  } else if (version_added) {
    className = 'yes';
    if (version_removed || (flags && flags.length)) {
      className = 'no';
    }
  } else {
    className = 'no';
  }
  if (partial_implementation && !version_removed) {
    className = 'partial';
  }

  return className;
}

function getSupportBrowserReleaseDate(
  support: SupportStatementExtended | undefined
): string | undefined {
  if (!support) {
    return undefined;
  }
  return getFirst(support).release_date;
}

function StatusIcons({ status }: { status: bcd.StatusBlock }): string {
  const icons = [
    status.experimental && {
      title: 'Experimental. Expect behavior to change in the future.',
      text: 'Experimental',
      iconClassName: 'ic-experimental',
    },
    status.deprecated && {
      title: 'Deprecated. Not for use in new websites.',
      text: 'Deprecated',
      iconClassName: 'ic-deprecated',
    },
    !status.standard_track && {
      title: 'Non-standard. Expect poor cross-browser support.',
      text: 'Non-standard',
      iconClassName: 'ic-non-standard',
    },
  ].filter(isTruthy);

  return icons.length === 0 ? '' : (
    `<div class="bc-icons">
      ${icons.map((icon) =>
      (`<abbr key="${icon.iconClassName}" class="only-icon" title="${icon.title}">
          <span>${icon.text}</span>
          <i class="${icon.iconClassName}"></i>
        </abbr>`)).join('')}
    </div>`
  );
}

function NonBreakingSpace() {
  return '\u00A0';
}

function labelFromString(version: string | boolean | null | undefined) {
  if (typeof version !== 'string') {
    return '?';
  }
  if (!version.startsWith('≤')) {
    return version;
  }
  const title = `Supported in version ${version.slice(1)} or earlier.`;
  return (
    `<span title=${title}>
      <sup>≤&#xA0;</sup>
  ${version.slice(1)}
  </span>`
  );
}

const CellText =({ support }: { support: bcd.SupportStatement | undefined }): string => {
  const currentSupport = getFirst(support);

  const added = currentSupport && currentSupport.version_added;
  const removed = currentSupport && currentSupport.version_removed;

  let status:
      | { isSupported: 'unknown' }
      | { isSupported: 'no' | 'yes' | 'partial'; label?: string };

  switch (added) {
  case null:
    status = { isSupported: 'unknown' };
    break;
  case true:
    status = { isSupported: 'yes' };
    break;
  case false:
    status = { isSupported: 'no' };
    break;
  default:
    status = { isSupported: 'yes', label: labelFromString(added) };
    break;
  }

  if (removed) {
    status = {
      isSupported: 'no',
      label: (`${labelFromString(added)}
          ${NonBreakingSpace()}— ${labelFromString(removed)}`),
    };
  } else if (currentSupport && currentSupport.partial_implementation) {
    status = {
      isSupported: 'partial',
      label: typeof added === 'string' ? labelFromString(added) : 'Partial',
    };
  }

  let label: string ;
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

  case 'no':
    title = 'No support';
    label = status.label || 'No';
    break;

  case 'unknown':
    title = 'Compatibility unknown; please update this.';
    label = '?';
    break;
  }

  return (`<abbr class="bc-level-${getSupportClassName(
    currentSupport
  )} only-icon" title="${title}">
          <span>${title}</span>
        </abbr>
        ${label}`);
};

function Icon({ name }: { name: string }): string {
  return (`
  <abbr class="only-icon" title="${name}">
    <span>${name}</span>
    <i class="ic-${name}"></i>
  </abbr>`
  );
}

function CellIcons({ support }: { support: bcd.SupportStatement | undefined }): string {
  const supportItem = getFirst(support);
  if (!supportItem) {
    return '';
  }
  return (`
<div class="bc-icons">
${supportItem.prefix && Icon({name: 'prefix'}) || ''}
${supportItem.notes && Icon({name: 'footnote'}) || ''}
${supportItem.alternative_name && Icon({name: 'altname'}) || ''}
${supportItem.flags && Icon({name: 'disabled'}) || ''}
</div>`);
}

function FlagsNote({
  browserInfo,
  supportItem,
  browser,
}: {
  browserInfo: bcd.Browsers;
  supportItem: bcd.SimpleSupportStatement;
  browser: bcd.BrowserNames;
}): string {
  if (!browserInfo) {
    throw new Error('Missing browser info');
  }
  const info = browserInfo[browser];

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
    }).join('')}.${info.pref_url &&
  flags.some((flag) => flag.type === 'preference') &&
  ` To change preferences in ${info.name}, visit ${info.pref_url}.` || ''}
`);
}

function getNotes(
  browserInfo: bcd.Browsers,
  browser: bcd.BrowserNames,
  support: bcd.SupportStatement,
  // It seems that yari is adding locale support to compatibility table
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  locale: string
): string[] {
  return asList(support)
    .flatMap((item, i) => {
      const supportNotes = [
        item.prefix
          ? {
            iconName: 'prefix',
            label: `Implemented with the vendor prefix: ${item.prefix}`,
          }
          : null,
        item.notes
          ? (Array.isArray(item.notes)
            ? item.notes
            : [item.notes]
          ).map((note: string) => ({ iconName: 'footnote', label: note }))
          : null,
        item.alternative_name
          ? {
            iconName: 'altname',
            label: item.alternative_name,
          }
          : null,
        item.flags
          ? {
            iconName: 'disabled',
            label: FlagsNote({
              browserInfo, browser, supportItem: item
            }),
          }
          : null,
      ].flat().filter(isTruthy);

      const hasNotes = supportNotes.length > 0;
      return ((i === 0 || hasNotes) && (
        `<div key="${i}" class="bc-notes-wrapper">
      <dt class="bc-supports-${getSupportClassName(item)} bc-supports">
      ${CellText({support: item})}
      ${CellIcons({support: item})}
      </dt>
      ${supportNotes.map(({iconName, label}, i) => (
          `<dd key="${i}">
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
  browserInfo,
  browser,
  support,
  showNotes,
  locale,
}: {
  browserInfo: bcd.Browsers,
  browser: bcd.BrowserNames;
  support: bcd.SupportStatement | undefined;
  showNotes: boolean;
  locale: string;
}) {
  const supportClassName = getSupportClassName(support);
  const browserReleaseDate = getSupportBrowserReleaseDate(support);
  const hasNotes =
    support &&
    asList(support).some((item) =>
      item.prefix || item.notes || item.alternative_name || item.flags);
  // aria-expanded="${showNotes ? 'true' : 'false'}"
  return (
    `<td key="${browser}" class="bc-browser-${browser} bc-supports-${supportClassName} ${
      hasNotes ? 'bc-has-history' : ''
    }" aria-expanded="false" tabIndex="${hasNotes ? 0 : ''}" title="${
      browserReleaseDate ? `Released ${browserReleaseDate}` : ''
    }">
  <span class="bc-browser-name">
  ${BrowserName({browserInfo, id: browser})}
  </span>
  ${CellText({support})}
  ${CellIcons({support})}
  ${hasNotes && (
    // class="${ showNotes ? 'bc-history-link-inverse' : '' }"
      `<button type="button" title="Open implementation notes"
    class="bc-history-link only-icon">
    <span>Open</span>
    <i class="ic-history" aria-hidden="true"></i>
    </button>`
    ) || ''}
  ${hasNotes && showNotes && support && (
      `<dl class="bc-history bc-history-mobile bc-hidden">
        ${getNotes(browserInfo, browser, support, locale).join('')}
      </dl>`
    ) || ''}
  </td>`
  );
}

export const FeatureRow = ({
  browserInfo,
  index,
  feature,
  browsers,
  locale,
}: {
  browserInfo: bcd.Browsers;
  index: number;
  feature: {
    name: string;
    compat: CompatStatementExtended;
    isRoot: boolean;
  };
  browsers: bcd.BrowserNames[];
  locale: string;
}): string => {
  const { name, compat, isRoot } = feature;
  const title = compat.description ? (
    `<span>${compat.description}</span>`
  ) : (
    `<code>${name}</code>`
  );

  let titleNode: string;

  if (compat.bad_url && compat.mdn_url) {
    titleNode = (
      `<div class="bc-table-row-header">
        <abbr class="new" title="${compat.mdn_url} does not exist">
        ${title}
        </abbr>
        ${compat.status && StatusIcons({status: compat.status}) || ''}
      </div>`);
  } else if (compat.mdn_url && !isRoot) {
    titleNode = (
      `<a href="${compat.mdn_url}" class="bc-table-row-header">
        ${title}
        ${compat.status && StatusIcons({status: compat.status}) || ''}
      </a>`
    );
  } else {
    titleNode = (
      `<div class="bc-table-row-header">
        ${title}
        ${compat.status && StatusIcons({status: compat.status}) || ''}
      </div>`
    );
  }

  return (`<tr class="bc-content-row" key="${index}">
          <th scope="row">${titleNode}</th>
    ${browsers.map((browser) => (
      CompatCell({
        browserInfo, browser,
        support: compat.support[browser],
        showNotes: true,
        locale
      })
    )).join('')}
    </tr>
    <tr class="bc-history bc-hidden" key="${index}">
      <td colSpan="${browsers.length + 1}">
        <dl class="bc-history-content"></dl>
      </td>
    </tr>`);
};
