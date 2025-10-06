import {
  getSupportBrowserReleaseDate,
  getSupportClassName,
  labelFromString,
  versionLabelFromSupport,
} from './feature-row.js';
import {
  SHOW_BROWSERS,
  asList,
  bugURLToString,
  getCurrentSupport,
  getFirst,
  hasMore,
  hasNoteworthyNotes,
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

const DEFAULT_LOCALE = 'en-US';

/**
 * Used to generate a random element id by combining a prefix with a random string.
 *
 * @param {string} prefix
 * @returns {string}
 */
function randomIdString(prefix: string = 'id-'): string {
  return Math.random().toString(36).replace('0.', prefix);
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
    return browser.split('_')[0] ?? '';
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
  };

  query: string;
  data: Identifier;
  browserInfo: Partial<Browsers>;
  locale: string;
  _pathname: string;
  _platforms: string[];
  _browsers: BrowserName[];

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

        if (!SHOW_BROWSERS.includes(browser)) {
          continue;
        }

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
    [this._platforms, this._browsers] = gatherPlatformsAndBrowsers(
      this._category,
      this.data,
      this.browserInfo,
    );
  }

  _renderTable() {
    return `<figure class="table-container">
      <figure class="table-container-inner">
        <table
          class="bc-table bc-table-web"
          style="--compat-browser-count: ${Object.keys(this._browsers).length}"
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

    const grid = platformsWithBrowsers.map(({ browsers }) => browsers.length);

    const platformCells = platformsWithBrowsers.map(
      ({ platform, browsers }, index) => {
        // Get the intersection of browsers in the `browsers` array and the
        // `PLATFORM_BROWSERS[platform]`.
        const browserCount = browsers.length;
        const cellClass = `bc-platform bc-platform-${platform}`;
        const iconClass = `icon icon-${platform}`;

        const columnStart =
          2 + grid.slice(0, index).reduce((acc, x) => acc + x, 0);
        const columnEnd = columnStart + browserCount;
        return `<th
          class="${cellClass}"
          colspan="${browserCount}"
          title="${platform}"
          style="grid-column: ${columnStart} / ${columnEnd}"
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
        `<th class="bc-browser bc-browser-${browser}">
          <div class="bc-head-txt-label bc-head-icon-${browser}">
            ${this.browserInfo[browser]?.name}
          </div>
          <div
            class="bc-head-icon-symbol icon icon-${browserToIconName(
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

    const featureRows = features.map((feature) => {
      // <FeatureRow>
      const { name, compat, depth } = feature;

      const title = compat.description
        ? `<span>${(compat.description)}</span>`
        : `<code>${name}</code>`;

      let titleNode;
      const titleContent = `${title}${compat.status &&
      this._renderStatusIcons(compat.status) || ''}`;
      if (compat.mdn_url && depth > 0) {
        const href = compat.mdn_url.replace(
          `/${DEFAULT_LOCALE}/docs`,
          `/${locale}/docs`,
        );
        titleNode = `<a
          href="${href}"
          class="bc-table-row-header"
        >
          ${titleContent}
        </a>`;
      } else {
        titleNode = `<div class="bc-table-row-header">
          ${titleContent}
        </div>`;
      }


      const browserCells = browsers.map((browserName) => {
        // <CompatCell>
        const browser = browserInfo[browserName];
        if (!browser) {
          return '';
        }
        const support = compat.support[browserName] ?? {
          version_added: false,
        };

        const timelineId = randomIdString('timeline-');
        const supportClassName = getSupportClassName(support, browser);
        const notes = this._renderNotes(browser, support);

        return `<td
          class="bc-support bc-browser-${browserName} bc-supports-${supportClassName} ${
  notes ? 'bc-has-history' : ''
}"
        >
          <button
            type="button"
            class="mdn-local-toggle-history-btn"
            aria-controls=${timelineId}
            title="${notes ? 'Toggle history' : ''}"
          >
            ${this._renderCellText(support, browser)}
          </button>
          ${notes &&
        `<div
            id="${timelineId}"
            class="timeline"
            tabindex="0"
            aria-expanded="false"
          >
            <dl class="bc-notes-list">${notes.join('')}</dl>
          </div>` || ''}
        </td>`;
      });

      return `<tr>
        <th class="bc-feature bc-feature-depth-${depth}" scope="row">
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
   */
  _renderCellIcons(support: SupportStatement): string | undefined {
    const supportItem = getCurrentSupport(support);
    if (!supportItem) {
      return;
    }

    const icons = [
      supportItem.prefix && this._renderIcon('prefix'),
      hasNoteworthyNotes(supportItem) && this._renderIcon('footnote'),
      supportItem.alternative_name && this._renderIcon('altname'),
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
    return [...asList(support)]
      .reverse()
      .flatMap((item, i) => {
        const notes = this._getNotes(browser, support, item);

        const notesItems = notes.map(({ iconName, label }) => {
          return `<dd class="bc-supports-dd">
            ${this._renderIcon(iconName)}<span>${(label || '')}</span>
          </dd>`;
        });

        const hasNotes = notesItems.length > 0;

        return (
          (i === 0 || hasNotes) &&
          `<div class="bc-notes-wrapper">
            <dt
              class="bc-supports-${getSupportClassName(
            item,
            browser,
          )} bc-supports"
            >
              ${this._renderCellText(item, browser, true) || ''}
            </dt>
            ${notesItems.join('')} ${hasNotes ? '' : '<dd></dd>'}
          </div>` || ''
        );
      })
      .filter(Boolean);
  }

  /**
   * @param {BrowserStatement} browser
   * @param {SupportStatement} support
   * @param {SimpleSupportStatement} item
   * @returns
   */
  _getNotes(
    browser: BrowserStatement,
    support: SupportStatement,
    item: SimpleSupportStatement
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

    if (item.prefix) {
      supportNotes.push({
        iconName: 'prefix',
        label: `Implemented with the vendor prefix: ${item.prefix}`,
      });
    }

    if (item.alternative_name) {
      supportNotes.push({
        iconName: 'altname',
        label: `Alternate name: ${item.alternative_name}`,
      });
    }

    if (item.flags) {
      for (const { type, name, value_to_set } of item.flags) {
        supportNotes.push({
          iconName: 'disabled',
          label: renderCompatSupportFlags({
            has_added: Number(
              typeof item.version_added === 'string' &&
                item.version_added !== 'preview',
            ),
            version_added: item.version_added,
            has_last: Number(typeof item.version_last === 'string'),
            versionLast: item.version_last,
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
    if (
      isFullySupportedWithoutLimitation(item) &&
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
   */
  _renderCellText(
    support: SupportStatement | undefined,
    browser: BrowserStatement,
    timeline = false
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
          title=${browserReleaseDate && !timeline
    ? `${ browser.name } ${ added } – Release date: ${ browserReleaseDate }`
    : ''}
        >
          ${!timeline || added ? label : ''}
          ${browserReleaseDate && timeline
    ? `(Release date: ${browserReleaseDate})`
    : ''}
        </span>
      </div>
      ${support && this._renderCellIcons(support) || ''}
    </div>`;
  }

  _renderTableLegend() {
    const { _browsers: browsers, browserInfo } = this;

    if (!browserInfo) {
      throw new Error('Missing browser info');
    }

    const items = this._getActiveLegendItems(
      this.data,
      this._name,
      browserInfo,
      browsers,
    ).map((key) => {
      const label = this._getLegendLabel(key);
      return ['yes', 'partial', 'no', 'unknown', 'preview'].includes(key)
        ? `<div class="bc-legend-item">
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
        : `<div class="bc-legend-item">
            <dt class="bc-legend-item-dt">
              <abbr class="legend-icons icon icon-${key}" title="${label}"></abbr>
            </dt>
            <dd class="bc-legend-item-dd">${label}</dd>
          </div>`;
    });

    return `<section class="bc-legend">
      <h3 class="visually-hidden" id="Legend">
        Legend
      </h3>
      <p class="bc-legend-tip">
        Tip: you can click/tap on a cell for more information.
      </p>
      <dl class="bc-legend-items-container">${items.join('')}</dl>
    </section>`;
  }

  render() {
    return `${this._renderTable()} ${this._renderTableLegend()}`;
  }
}

/**
 * Return a list of platforms and browsers that are relevant for this category &
 * data.
 *
 * If the category is "webextensions", only those are shown. In all other cases
 * at least the entirety of the "desktop" and "mobile" platforms are shown. If
 * the category is JavaScript, the entirety of the "server" category is also
 * shown. In all other categories, if compat data has info about Deno / Node.js
 * those are also shown. Deno is always shown if Node.js is shown.
 * @param {string} category
 * @param {Identifier} data
 * @param {Partial<Browsers>} browserInfo
 * @returns {[string[], BrowserName[]]}
 */
export function gatherPlatformsAndBrowsers(category: string, data: Identifier, browserInfo: Partial<Browsers>): [string[], BrowserName[]] {
  const runtimes = Object.entries(browserInfo)
    .filter(([, { type }]) => type == 'server')
    .map(([key]) => key);

  const platforms = ['desktop', 'mobile'];
  if (
    category === 'javascript' ||
    runtimes.some(
      (runtime) => data.__compat && runtime in data.__compat.support,
    )
  ) {
    platforms.push('server');
  }

  /** @type {BrowserName[]} */
  let browsers: BrowserName[] = [];

  // Add browsers in platform order to align table cells
  for (const platform of platforms) {
    const platformBrowsers: BrowserName[] = /** @type {BrowserName[]} */ (
      Object.keys(browserInfo)
    ) as BrowserName[];
    browsers.push(
      ...platformBrowsers.filter(
        (browser) =>
          browser in browserInfo && browserInfo[browser]?.type === platform,
      ),
    );
  }

  // Filter WebExtension browsers in corresponding tables.
  if (category === 'webextensions') {
    browsers = browsers.filter(
      (browser) => browserInfo[browser]?.accepts_webextensions,
    );
  }

  // If there is no data for a runtime in a category outside "javascript", hide it.
  if (category !== 'javascript') {
    for (const runtime of runtimes) {
      if (data.__compat && !(runtime in data.__compat.support)) {
        browsers = browsers.filter((browser) => browser !== runtime);
      }
    }
  }

  browsers = browsers.filter((browser) => SHOW_BROWSERS.includes(browser));

  return [platforms, [...browsers]];
}
