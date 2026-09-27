import {
  getSupportBrowserReleaseDate,
  getSupportClassName,
  labelFromString,
  versionLabelFromSupport,
} from './feature-row.js';
import {
  asList,
  bugURLToString,
  changeDocsLocale,
  getCurrentSupport,
  getFirst,
  groupSupportBranches,
  hasMore,
  hasNoteworthyNotes,
  isCurrentPageLink,
  isFullySupportedWithoutLimitation,
  isNotSupportedAtAll,
  listFeatures,
  versionIsPreview,
} from './utils.js';
import type {
  BrowserName,
  Browsers,
  BrowserStatement,
  Identifier,
  StatusBlock,
  SupportStatement,
  SimpleSupportStatement,
} from './types.js';
import type {
  IconName,
} from './compat.js';
import {renderCompatSupportFlags} from './flags.js';
import {DEFAULT_BROWSERS, gatherPlatformsAndBrowsers} from './browsers.js';
import type {HiddenBrowsers} from './browsers.js';

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/** @type {IconName[]} */
const ICON_NAMES: IconName[] = [
  'yes',
  'partial',
  'preview',
  'no',
  'unknown',
  'experimental',
  'nonstandard',
  'deprecated',
  'footnote',
  'disabled',
  'altname',
  'prefix',
  'more',
];

/**
 * @param {BrowserName} browser
 * @returns {string}
 */
function browserToIconName(browser: BrowserName): string {
  if (browser.startsWith('firefox')) {
    return 'firefox';
  } else if (browser === 'webview_android') {
    return 'webview';
  } else if (browser === 'webview_ios') {
    return 'safari';
  } else {
    return browser.split('_', 1)[0] ?? '';
  }
}

export class MDNCompatTable {
  static properties = {
    query: {},
    locale: {},
    data: {},
    browserInfo: { attribute: 'browserinfo' },
    _pathname: { state: true },
    _platforms: { state: true },
    _browsers: { state: true },
    _showTimelineId: { state: true },
  };

  query: string;
  data: Identifier;
  browserInfo: Partial<Browsers>;
  locale: string;
  _pathname: string;
  // Offline tables share a document instead of separate shadow roots.
  _tableIndex = 0;
  _platforms: string[];
  _browsers: BrowserName[];
  _defaultBrowsers: BrowserName[] = [];
  _hiddenBrowsers: HiddenBrowsers = {};
  _showTimelineId: string | undefined;

  constructor() {
    this.query = '';
    /** @type {Identifier} */
    this.data = {};
    /** @type {Partial<Browsers>} */
    this.browserInfo = {};
    this.locale = '';
    this._pathname = '';
    /** @type {string[]} */
    this._platforms = [];
    /** @type {BrowserName[]} */
    this._browsers = [];
    /** @type {string|undefined} */
    this._showTimelineId = undefined;
  }

  get _breadcrumbs() {
    return this.query.split('.');
  }

  get _category() {
    return this._breadcrumbs[0] ?? '';
  }

  get _name() {
    const bc = this._breadcrumbs;
    return bc.length > 0
      ? bc[bc.length - 1]
      : '';
  }

  /**
   * Gets the active legend items based on browser compatibility data.
   * @param {Identifier} compat - The compatibility data identifier.
   * @param {string} name - The name of the feature.
   * @param {Partial<Browsers>} browserInfo - Information about browsers.
   * @param {BrowserName[]} browsers - The list of displayed browsers.
   * @returns {IconName[]} An array of legend keys.
   */
  _getActiveLegendItems(
    compat: Identifier,
    name: string,
    browserInfo: Partial<Browsers>,
    browsers: BrowserName[]
  ): IconName[] {
    /** @type {Set<IconName>} */
    const legendItems = new Set();

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

      for (const browser of browsers) {
        const browserSupport = feature.compat.support[browser] ?? {
          version_added: false,
        };

        const firstSupportItem = getFirst(browserSupport);
        if (firstSupportItem && hasNoteworthyNotes(firstSupportItem)) {
          legendItems.add('footnote');
        }

        for (const versionSupport of asList(browserSupport)) {
          if (versionSupport.version_added) {
            if (versionSupport.flags && versionSupport.flags.length > 0) {
              legendItems.add('no');
            } else if (
              browserInfo[browser] &&
              versionIsPreview(
                versionSupport.version_added,
                browserInfo[browser],
              )
            ) {
              legendItems.add('preview');
            } else {
              legendItems.add('yes');
            }
          } else if (versionSupport.version_added == undefined) {
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

    return ICON_NAMES.filter((key) => legendItems.has(key));
  }

  connectedCallback() {
    [, this._defaultBrowsers] = gatherPlatformsAndBrowsers(
      this._category,
      this.data,
      this.browserInfo,
    );
    // Keep every applicable column in the static document so settings work offline.
    [this._platforms, this._browsers, this._hiddenBrowsers] = gatherPlatformsAndBrowsers(
      this._category,
      this.data,
      this.browserInfo,
      Object.fromEntries(Object.keys(this.browserInfo).map(browser => [browser, true])),
    );
  }

  _renderSettings() {
    const names = Object.keys(this.browserInfo) as BrowserName[];
    const platforms = [...new Set(names.map(browser => this.browserInfo[browser]!.type))];
    const order = ['desktop', 'mobile', 'server', 'xr'];
    platforms.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    return `<details class="bc-settings" hidden>
      <summary>Settings</summary>
      <form>
        <p>Select the browsers to show in compatibility tables. Your selection is saved in this browser.</p>
        ${platforms.map(platform => `<fieldset>
          <legend>${platform === 'xr' ? 'XR' : platform[0].toUpperCase() + platform.slice(1)}</legend>
          ${names.filter(browser => this.browserInfo[browser]?.type === platform)
    .map(browser => this._renderBrowserSetting(browser)).join('')}
        </fieldset>`).join('')}
        <div class="bc-settings-actions">
          <button type="button" data-action="defaults">Restore defaults</button>
          <button type="button" data-action="cancel">Cancel</button>
          <button type="submit">Save</button>
        </div>
      </form>
    </details>`;
  }

  _renderBrowserSetting(browser: BrowserName) {
    const selected = DEFAULT_BROWSERS.includes(browser);
    const reason = this._hiddenBrowsers[browser];
    const note = reason === 'no-data' ? 'No support data for this feature.' :
      reason === 'not-applicable' ? 'WebExtensions do not apply to this browser.' : '';
    return `<label><input type="checkbox" name="${browser}" data-default="${selected}"${selected ? ' checked' : ''}>
      <span>${escapeAttribute(this.browserInfo[browser]!.name)}${note ? `<small>${note}</small>` : ''}</span>
    </label>`;
  }

  _renderTable() {
    return `<figure class="table-container">
      <figure class="table-container-inner">
        ${this._renderSettings()}
        <p class="bc-no-browsers"${this._defaultBrowsers.length ? ' hidden' : ''}>
          No browsers selected. Use "Settings" to choose which browsers to show.
        </p>
        <table
          class="bc-table bc-table-web"
          style="--compat-table-browser-count: ${Math.max(1, this._defaultBrowsers.length)}"
          ${this._defaultBrowsers.length ? '' : 'hidden'}
        >
          ${this._renderTableHeader()} ${this._renderTableBody()}
        </table>
      </figure>
    </figure>`;
  }

  _renderTableHeader() {
    return `<thead>
      ${this._renderPlatformHeaders()} ${this._renderBrowserHeaders()}
    </thead>`;
  }

  _renderPlatformHeaders() {
    const platformsWithBrowsers = this._platforms.map((platform) => ({
      platform,
      browsers: this._browsers.filter(
        (browser) => this.browserInfo[browser]?.type === platform,
      ),
    }));

    const grid = platformsWithBrowsers.map(({ browsers }) =>
      browsers.filter(browser => this._defaultBrowsers.includes(browser)).length);

    const platformCells = platformsWithBrowsers.map(
      ({ platform, browsers }, index) => {
        // Get the intersection of browsers in the `browsers` array and the
        // `PLATFORM_BROWSERS[platform]`.
        const browserCount = browsers.filter(browser => this._defaultBrowsers.includes(browser)).length;
        const cellClass = `bc-platform bc-platform-${platform}`;
        const iconClass = `icon icon-${platform}`;

        const columnStart =
          2 + grid.slice(0, index).reduce((acc, x) => acc + x, 0);
        const columnEnd = columnStart + Math.max(1, browserCount);
        return `<th
          class="${cellClass}"
          data-platform="${platform}"
          colspan="${browserCount || 1}"
          title="${platform}"
          style="grid-column: ${columnStart} / ${columnEnd}"
          ${browserCount ? '' : 'hidden'}
        >
          <span class="${iconClass}"></span>
          <span class="visually-hidden">${platform}</span>
        </th>`;
      },
    );

    return `<tr class="bc-platforms">
      <td></td>
      ${platformCells.join('')}
    </tr>`;
  }

  _renderBrowserHeaders() {
    // <BrowserHeaders>
    const browserCells = this._browsers.map(
      (browser) =>
        `<th class="bc-browser bc-browser-${browser}" data-browser="${browser}"
          data-platform="${this.browserInfo[browser]?.type}"
          ${this._defaultBrowsers.includes(browser) ? '' : 'hidden'}>
          <div class="bc-head-txt-label bc-head-icon-${browser}">
            ${this.browserInfo[browser]?.name}
          </div>
          <div
            class="bc-head-icon-symbol icon icon-browser icon-${browserToIconName(
    browser,
  )}"
          ></div>
        </th>`,
    );

    return `<tr class="bc-browsers">
      <td></td>
      ${browserCells.join('')}
    </tr>`;
  }

  _renderTableBody() {
    // <FeatureListAccordion>
    const { data, _browsers: browsers, browserInfo, locale } = this;
    let features = listFeatures(data, '', this._name);

    const MAX_FEATURES = 100;

    // If there are too many features, hide nested features.
    if (features.length > MAX_FEATURES) {
      features = features.filter(({ depth }) => depth < 2);
    }

    // If there are still too many features, hide non-standard features.
    if (features.length > MAX_FEATURES) {
      features = features.filter(
        ({ compat: { status } }) => status?.standard_track,
      );
    }

    // If there are still too many features, hide deprecated features.
    if (features.length > MAX_FEATURES) {
      features = features.filter(
        ({ compat: { status } }) => !status?.deprecated,
      );
    }

    // If there are still too many features, hide experimental features.
    if (features.length > MAX_FEATURES) {
      features = features.filter(
        ({ compat: { status } }) => !status?.experimental,
      );
    }

    // At this point, we did all we can to reduce the number of features shown.
    if (features.length > MAX_FEATURES) {
      features = features.slice(0, MAX_FEATURES);
    }

    const featureRows = features.map((feature, featureIndex) => {
      // <FeatureRow>
      const { name, compat, depth } = feature;

      const title = compat.description
        ? `<span>${(compat.description)}</span>`
        : `<code>${name}</code>`;

      let titleNode;
      const titleContent = `${title}${compat.status &&
      this._renderStatusIcons(compat.status) || ''}`;
      const href = compat.mdn_url && depth > 0 ? changeDocsLocale(compat.mdn_url, locale) : undefined;
      if (href && !isCurrentPageLink(href, this._pathname)) {
        titleNode = `<a
          href="${escapeAttribute(href)}"
          class="bc-table-row-header"
        >
          ${titleContent}
        </a>`;
      } else {
        titleNode = `<div class="bc-table-row-header">
          ${titleContent}
        </div>`;
      }


      const browserCells = browsers.map((browserName, browserIndex) => {
        // <CompatCell>
        const browser = browserInfo[browserName];
        if (!browser) {
          return '';
        }
        const support = compat.support[browserName] ?? {
          version_added: false,
        };

        const timelineId = `mdn-local-bcd-${this._tableIndex}-timeline-${featureIndex}-${browserIndex}`;
        const supportClassName = getSupportClassName(support, browser);
        const notes = this._renderNotes(browser, support);

        const hasHistory = notes.length > 0;
        // const isExpanded = hasHistory && this._showTimelineId == timelineId;
        return `<td
          class="bc-support bc-browser-${browserName} bc-supports-${supportClassName} ${
  notes ? 'bc-has-history' : ''
}"
          data-browser="${browserName}"
          ${this._defaultBrowsers.includes(browserName) ? '' : 'hidden'}
        >
          <button
            type="button"
            class="mdn-local-toggle-history-btn"
            aria-controls="${timelineId}"
            aria-expanded="false"
            title="${notes ? 'Toggle history' : ''}"
          >
            ${this._renderCellText(support, browser)}
          </button>
          ${hasHistory &&
        `<div
            id="${timelineId}"
            class="timeline"
            tabindex="0"
          >
            <div class="bc-notes-list">${notes.join('')}</div>
          </div>` || ''}
        </td>`;
      });

      return `<tr>
        <th class="bc-feature" style="--compat-feature-depth: ${depth}" scope="row">
          ${titleNode || ''}
        </th>
        ${browserCells.join('')}
      </tr>`;
    });

    return `<tbody>
      ${featureRows.join('')}
    </tbody>`;
  }

  /**
   * @param {SupportStatement} support
   * @param {{ omitAliasModifiers?: boolean }} [options] - When `omitAliasModifiers` is
   *   true, the `prefix` and `altname` icons are skipped (because a branch
   *   heading already conveys the alias modifier).
   */
  _renderCellIcons(
    support: SupportStatement,
    { omitAliasModifiers = false }: { omitAliasModifiers?: boolean } = {}
  ): string | undefined {
    const supportItem = getCurrentSupport(support);
    if (!supportItem) {
      return;
    }

    const icons = [
      !omitAliasModifiers && supportItem.prefix && this._renderIcon('prefix'),
      hasNoteworthyNotes(supportItem) && this._renderIcon('footnote'),
      !omitAliasModifiers &&
        supportItem.alternative_name &&
        this._renderIcon('altname'),
      supportItem.flags && this._renderIcon('disabled'),
      hasMore(support) && this._renderIcon('more'),
    ].filter(Boolean);

    return icons.length > 0
      ? `<div class="bc-icons">${icons}</div>`
      : undefined;
  }

  /**
   * @param {IconName} name
   */
  _renderIcon(name: IconName) {
    const title = this._getLegendLabel(name);

    return `
      <span class="icon-wrap">
        <abbr class="only-icon" title="${(title || '')}">
          <span>${name}</span>
          <i class="icon icon-${name}"></i>
        </abbr>
      </span>
    `;
  }

  /**
   * @param {IconName} name
   */
  _getLegendLabel(name: IconName): string {
    return {
      yes: () => 'Full support',
      partial: () => 'Partial support',
      preview: () => 'In development. Supported in a pre-release version.',
      no: () => 'No support',
      unknown: () => 'Compatibility unknown',
      experimental: () => 'Experimental. Expect behavior to change in the future.',
      nonstandard: () => 'Non-standard. Check cross-browser support before using.',
      deprecated: () => 'Deprecated. Not for use in new websites.',
      footnote: () => 'See implementation notes.',
      disabled: () => 'User must explicitly enable this feature.',
      altname: () => 'Uses a non-standard name',
      prefix: () => 'Requires a vendor prefix or different name for use.',
      more: () => 'Has more compatibility info.',
    }[name]();
  }

  /**
   * @param {StatusBlock} status
   */
  _renderStatusIcons(status: StatusBlock): string | undefined {
    // <StatusIcons>
    /**
     * @type {Array<{ title: import("@lit").L10nResult; text: import("@lit").L10nResult; iconClassName: string }>}
     */
    const icons: Array<{
      title: string;
      text: string;
      iconClassName: string
    }> = [];

    if (status.experimental) {
      icons.push({
        title: this._getLegendLabel('experimental'),
        text: 'Experimental',
        iconClassName: 'icon-experimental',
      });
    }

    if (status.deprecated) {
      icons.push({
        title: this._getLegendLabel('deprecated'),
        text: 'Deprecated',
        iconClassName: 'icon-deprecated',
      });
    }

    if (!status.standard_track) {
      icons.push({
        title: this._getLegendLabel('nonstandard'),
        text: 'Non-standard',
        iconClassName: 'icon-nonstandard',
      });
    }

    const renderedIcons = icons.map(
      (icon) =>
        `<abbr
          class="only-icon icon ${icon.iconClassName}"
          title="${icon.title}"
        >
          <span>${icon.text}</span>
        </abbr>`,
    );

    return icons.length === 0
      ? undefined
      : `<div class="bc-icons">${renderedIcons.join('')}</div>`;
  }

  /**
   *
   * @param {BrowserStatement} browser
   * @param {SupportStatement} support
   */
  _renderNotes(browser: BrowserStatement, support: SupportStatement): string[] {
    // Support arrays interleave parallel branches (e.g. unprefixed vs.
    // `-webkit-` vs. `-moz-`). Render each branch as its own timeline so
    // versions stay in chronological order within the branch. Any branch
    // with a `prefix` or `alternative_name` gets a heading conveying the
    // alias modifier, even when there is no canonical branch to contrast
    // with.
    const branches = groupSupportBranches(support);

    return branches.map((branchItems) => {
      const { prefix, alternative_name } = branchItems[0];
      const hasAliasModifier = !!(prefix || alternative_name);
      const heading = hasAliasModifier
        ? this._renderBranchHeading(prefix, alternative_name)
        : '';

      const wrappers = [...branchItems].reverse().flatMap((item, i) => {
        // Suppress prefix/alt-name notes when the branch heading already
        // conveys the alias modifier — avoids redundancy.
        const notes = this._getNotes(browser, support, item, {
          omitAliasModifiers: hasAliasModifier,
        });

        const notesItems = notes.map(({ iconName, label }) => {
          return `<div class="bc-supports-dd">
            ${this._renderIcon(iconName)}<span>${(label || '')}</span>
          </div>`;
        });

        const hasNotes = notesItems.length > 0;

        // Always render the first (most recent) item even when it has no
        // notes, so each branch shows at least one row in its timeline.
        return (
          (i === 0 || hasNotes) &&
          `<div class="bc-notes-wrapper">
            <div
              class="bc-supports-${getSupportClassName(
            item,
            browser,
          )} bc-supports"
            >
              ${this._renderCellText(item, browser, true, {
            omitAliasModifiers: hasAliasModifier,
          }) || ''}
            </div>
            ${notesItems.join('')}
            ${hasNotes ? '' : '<div class="bc-notes-end"></div>'}
          </div>` || ''
        );
      }).filter(Boolean);

      return `<div class="bc-branch">
        ${heading}
        <div class="bc-branch-items">${wrappers.join('')}</div>
      </div>`;
    });
  }

  /**
   * Called only when at least one of `prefix` / `alternativeName` is present.
   * @param {string | undefined} prefix
   * @param {string | undefined} alternativeName
   */
  _renderBranchHeading(
    prefix: string | undefined,
    alternativeName: string | undefined
  ): string {
    const label =
      prefix && alternativeName
        ? `Prefix: <code>${prefix}</code>, alternate name: <code>${alternativeName}</code>`
        : prefix
          ? `Prefix: <code>${prefix}</code>`
          : `Alternate name: <code>${alternativeName}</code>`;
    const icons = [
      prefix && this._renderIcon('prefix'),
      alternativeName && this._renderIcon('altname'),
    ].filter(Boolean);
    return `<div class="bc-branch-heading">
      <div class="bc-icons">${icons.join('')}</div>
      <span>${label}</span>
    </div>`;
  }

  /**
   * @param {BrowserStatement} browser
   * @param {SupportStatement} support
   * @param {SimpleSupportStatement} item
   * @param {{ omitAliasModifiers?: boolean }} [options] - When `omitAliasModifiers` is
   *   true, prefix / alternative_name don't count as limitations when judging
   *   full support (because a branch heading already conveys the modifier).
   * @returns
   */
  _getNotes(
    browser: BrowserStatement,
    support: SupportStatement,
    item: SimpleSupportStatement,
    { omitAliasModifiers = false }: { omitAliasModifiers?: boolean } = {}
  ): Array<{iconName: IconName; label: string | undefined }> {
    /**
     * @type {Array<{iconName: IconName; label: string | import("@lit").L10nResult | undefined }>}
     */
    const supportNotes: Array<{iconName: IconName; label: string |undefined }> = [];

    if (
      item.version_removed &&
      !asList(support).some(
        (otherItem) => otherItem.version_added === item.version_removed,
      )
    ) {
      supportNotes.push({
        iconName: 'footnote',
        label: `Removed in ${labelFromString(item.version_removed, browser)} and later`,
      });
    }

    if (item.partial_implementation) {
      supportNotes.push({
        iconName: 'footnote',
        label: 'Partial support',
      });
    }

    // Note: prefix / alternative_name modifiers are conveyed by the branch
    // heading (see `_renderBranchHeading`), so they aren't pushed here.

    if (item.flags) {
      const hasAdded = typeof item.version_added === 'string' && item.version_added !== 'preview';
      const hasLast = typeof item.version_last === 'string';
      const versionRange = hasAdded ? (hasLast ? 'range' : 'from') : (hasLast ? 'until' : 'none');
      for (const { type, name, value_to_set } of item.flags) {
        supportNotes.push({
          iconName: 'disabled',
          label: renderCompatSupportFlags({
            version_range: versionRange,
            version_added: item.version_added,
            version_last: item.version_last,
            flag_type: type,
            flag_name: name,
            has_value: Number(typeof value_to_set === 'string'),
            flag_value: value_to_set,
            has_pref_url: Number(typeof browser.pref_url === 'string'),
            browser_name: browser.name,
            browser_pref_url: browser.pref_url,
          }),
        });
      }
    }

    if (item.notes) {
      const notes = Array.isArray(item.notes) ? item.notes : [item.notes];
      for (const note of notes) {
        supportNotes.push({
          iconName: 'footnote',
          label: note,
        });
      }
    }

    if (item.impl_url) {
      const impl_urls = Array.isArray(item.impl_url)
        ? item.impl_url
        : [item.impl_url];

      for (const impl_url of impl_urls) {
        supportNotes.push({
          iconName: 'footnote',
          label: `See <a href="${impl_url}">${ bugURLToString(impl_url) }</a>`,
        });
      }
    }

    if (versionIsPreview(item.version_added, browser)) {
      supportNotes.push({
        iconName: 'footnote',
        label: 'Preview browser support',
      });
    }

    // If we encounter nothing else than the required `version_added` and
    // `release_date` properties, assume full support.
    // EDIT 1-5-21: if item.version_added doesn't exist, assume no support.
    // When the branch heading already conveys the alias modifier, ignore prefix
    // and alternative_name when judging full support — otherwise a plain
    // `{ prefix, version_added }` item falls through to "Support unknown".
    if (
      isFullySupportedWithoutLimitation(item, {
        ignoreAliasModifiers: omitAliasModifiers,
      }) &&
      !versionIsPreview(item.version_added, browser)
    ) {
      supportNotes.push({
        iconName: 'footnote',
        label: 'Full support',
      });
    } else if (isNotSupportedAtAll(item)) {
      supportNotes.push({
        iconName: 'footnote',
        label: 'No support',
      });
    }

    if (supportNotes.length === 0) {
      supportNotes.push({
        iconName: 'unknown',
        label: 'Support unknown',
      });
    }

    return supportNotes;
  }

  /**
   *
   * @param {SupportStatement | undefined} support
   * @param {BrowserStatement} browser
   * @param {boolean} [timeline]
   * @param {{ omitAliasModifiers?: boolean }} [options] - Forwarded to
   *   {@link _renderCellIcons} to suppress prefix/altname icons when a branch
   *   heading already conveys the alias modifier.
   */
  _renderCellText(
    support: SupportStatement | undefined,
    browser: BrowserStatement,
    timeline = false,
    { omitAliasModifiers = false }: { omitAliasModifiers?: boolean } = {}
  ): string {
    const currentSupport = getCurrentSupport(support);

    const added = currentSupport?.version_added ?? undefined;
    const lastVersion = currentSupport?.version_last ?? undefined;

    const browserReleaseDate = getSupportBrowserReleaseDate(support);
    const supportClassName = getSupportClassName(support, browser);

    let status: { isSupported: string; label?: string };
    switch (added) {
    case undefined: {
      status = { isSupported: 'unknown' };
      break;
    }
    case false: {
      status = { isSupported: 'no' };
      break;
    }
    case 'preview': {
      status = { isSupported: 'preview' };
      break;
    }
    default: {
      status = {
        isSupported: supportClassName,
        label: versionLabelFromSupport(added, lastVersion, browser),
      };
      break;
    }
    }

    let label: string = '';
    /** @type {"" | import("@lit").L10nResult} */
    let title: string = '';

    switch (status.isSupported) {
    case 'yes': {
      title = 'Full support';
      label = status.label || 'Yes';
      break;
    }

    case 'partial': {
      title = 'Partial support';
      label = status.label || 'Partial';
      break;
    }

    case 'removed-partial': {
      if (timeline) {
        title = 'Partial support';
        label = status.label || 'Partial';
      } else {
        title = 'No support';
        label = status.label || 'No';
      }
      break;
    }

    case 'no': {
      title = 'No support';
      label = status.label || 'No';
      break;
    }

    case 'preview': {
      title = 'Preview support';
      label = status.label || browser.preview_name || '';
      break;
    }

    case 'unknown': {
      title = 'Support unknown';
      label = '?';
      break;
    }
    }

    title = `${browser.name} – ${title}`;

    return `<div
      class="${timeline
    ? 'bcd-timeline-cell-text-wrapper'
    : 'bcd-cell-text-wrapper'}"
    >
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
        <span class="bc-browser-name">${browser.name}</span>
        <span
          class="bc-version-label"
          title="${browserReleaseDate && !timeline
    ? escapeAttribute(`${browser.name} ${added} – Release date: ${browserReleaseDate}`)
    : ''}"
        >
          ${!timeline || added ? label : ''}
          ${browserReleaseDate && timeline
    ? `(Release date: ${browserReleaseDate})`
    : ''}
        </span>
      </div>
      ${support && this._renderCellIcons(support, { omitAliasModifiers }) || ''}
    </div>`;
  }

  _renderTableLegend() {
    const { _browsers: browsers, browserInfo } = this;

    if (!browserInfo) {
      throw new Error('Missing browser info');
    }

    const browserItems = browsers.map(browser => ({
      browser,
      items: this._getActiveLegendItems(this.data, this._name, browserInfo, [browser]),
    }));
    const items = ICON_NAMES.flatMap(key => {
      const matching = browserItems.filter(entry => entry.items.includes(key)).map(entry => entry.browser);
      if (!matching.length) return [];
      const attrs = `data-browsers="${matching.join(' ')}"${
        matching.some(browser => this._defaultBrowsers.includes(browser)) ? '' : ' hidden'}`;
      const label = this._getLegendLabel(key);
      return ['yes', 'partial', 'no', 'unknown', 'preview'].includes(key)
        ? `<div class="bc-legend-item" ${attrs}>
            <dt class="bc-legend-item-dt">
              <span class="bc-supports-${key} bc-supports">
                <abbr
                  class="bc-level bc-level-${key} icon icon-${key}"
                  title="${label}"
                >
                  <span class="visually-hidden">${label}</span>
                </abbr>
              </span>
            </dt>
            <dd class="bc-legend-item-dd">${label}</dd>
          </div>`
        : `<div class="bc-legend-item" ${attrs}>
            <dt class="bc-legend-item-dt">
              <abbr class="legend-icons icon icon-${key}" title="${label}"></abbr>
            </dt>
            <dd class="bc-legend-item-dd">${label}</dd>
          </div>`;
    });

    return `<section class="bc-legend"${this._defaultBrowsers.length ? '' : ' hidden'}>
      <h3 class="visually-hidden" id="mdn-local-bcd-${this._tableIndex}-legend">
        Legend
      </h3>
      <p class="bc-legend-tip">
        Tip: you can click/tap on a cell for more information.
      </p>
      <dl class="bc-legend-items-container">${items.join('')}</dl>
    </section>`;
  }

  render() {
    return `<div class="mdn-local-compat-table">${this._renderTable()} ${this._renderTableLegend()}</div>`;
  }
}
