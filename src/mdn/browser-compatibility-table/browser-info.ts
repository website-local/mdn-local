import type * as BCD from './types.js';

export function BrowserName({ browserInfo, id }: {
  browserInfo: BCD.Browsers,
  id: BCD.BrowserName
}): string {
  if (!browserInfo) {
    throw new Error('Missing browser info');
  }
  return browserInfo[id].name || '';
}
