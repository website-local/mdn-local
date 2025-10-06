import type { Browsers, Identifier } from './types.js';
import {MDNCompatTable} from './element.js';
export type Compat = { data: Identifier; browsers: Browsers; };

export function renderCompatibilityTable(
  json: Compat,
  query: string,
  locale: string
): string {
  const table = new MDNCompatTable();
  table.query = query || '';
  table.locale = locale || 'en-US';
  table.data = json.data;
  table.browserInfo = json.browsers;
  table.connectedCallback();
  return table.render();
}

/// endregion mdn-local helpers
