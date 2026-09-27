import type {VersionValue} from './types.js';

interface CompatSupportFlagsArgs {
  version_range: 'range' | 'from' | 'until' | 'none';
  version_added: VersionValue;
  version_last: VersionValue | undefined;
  flag_name: string;
  flag_type: string;
  has_value: number;
  flag_value: string | undefined;
  has_pref_url: number;
  browser_name: string;
  browser_pref_url: string | undefined;
}

export function renderCompatSupportFlags(args: CompatSupportFlagsArgs): string {
  const {
    version_range,
    version_added,
    version_last,
    flag_name,
    flag_type,
    has_value,
    flag_value,
    has_pref_url,
    browser_name,
    browser_pref_url
  } = args;

  // https://github.com/mdn/fred/pull/1738
  const prefixes = {
    range: `From version ${version_added} until ${version_last}, users`,
    from: `From version ${version_added}, users`,
    until: `Until ${version_last}, users`,
    none: 'Users',
  };
  let result = prefixes[version_range];

  // Adding space and flag name
  result += ' must explicitly set the <code>' + flag_name + '</code> ';

  // Flag type
  if (flag_type === 'runtime_flag') {
    result += 'runtime flag';
  } else {
    result += 'preference';
  }

  // Flag value
  if (has_value === 1) {
    result += ' to <code>' + flag_value + '</code>';
  }

  // Period
  result += '.';

  // Browser preference URL
  if (has_pref_url === 1) {
    if (flag_type === 'preference') {
      result += ' To change preferences in ' + browser_name + ', visit ' + browser_pref_url + '.';
    }
  }

  return result;
}
