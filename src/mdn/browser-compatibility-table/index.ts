import type { Browsers, Identifier } from './types.js';
import {CompatTable} from './compat-table.js';
export type Compat = { data: Identifier; browsers: Browsers; };

export function renderYariCompatibilityTable(
  json: Compat,
  query: string,
  locale: string
): string {
  const table = new CompatTable();
  table.query = query || '';
  table.locale = locale || 'en-US';
  table.data = json.data;
  table.browserInfo = json.browsers;
  table.connectedCallback();
  return table.render();
}

/// endregion mdn-local helpers
