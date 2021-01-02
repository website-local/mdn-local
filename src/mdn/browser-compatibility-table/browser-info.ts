import type * as bcd from './types';

export function BrowserName({ browserInfo, id }: {
  browserInfo: bcd.Browsers,
  id: bcd.BrowserNames
}): string {
  if (!browserInfo) {
    throw new Error('Missing browser info');
  }
  return browserInfo[id].name || '';
}
