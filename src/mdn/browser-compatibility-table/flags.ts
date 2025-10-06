import type {VersionValue} from './types.js';

interface CompatSupportFlagsArgs {
  has_added: number;
  version_added: VersionValue;
  has_last: number;
  versionLast: VersionValue | undefined;
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
    has_added,
    version_added,
    has_last,
    versionLast,
    flag_name,
    flag_type,
    has_value,
    flag_value,
    has_pref_url,
    browser_name,
    browser_pref_url
  } = args;

  let result = '';

  // First part: version added
  if (has_added === 1) {
    result += 'From version ' + version_added;
  }

  // Second part: handling last version/users
  if (has_last === 1) {
    if (has_added === 0) {
      result += 'Until ' + versionLast + ' users';
    } else if (has_added === 1) {
      result += ' until ' + versionLast + ' users';
    }
  } else {
    if (has_added === 0) {
      result += 'Users';
    } else if (has_added === 1) {
      result += ' users';
    }
  }

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
