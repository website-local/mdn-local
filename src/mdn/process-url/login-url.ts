import {mdnHosts} from './consts.js';

export function isMdnLoginUrl(url: string): boolean {
  const parsed = new URL(url);
  return !!mdnHosts[parsed.hostname] &&
    /^\/users\/(?:(?:fxa|github|google)\/login|signin)(?:\/|$)/
      .test(parsed.pathname);
}
