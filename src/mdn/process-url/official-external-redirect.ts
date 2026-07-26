import {
  skipExternal as skipExternalLogger
} from 'website-scrap-engine/lib/logger/logger.js';
import type {StaticDownloadOptions} from 'website-scrap-engine/lib/options.js';
import type {Resource} from 'website-scrap-engine/lib/resource.js';
import type {Cheerio} from 'website-scrap-engine/lib/types.js';
import URI from 'urijs';
import {
  officialExternalRedirectFallbackExclusions,
  officialExternalRedirects
} from './generated-official-external-redirects.js';

const DEFAULT_MDN_HOST = 'developer.mozilla.org';

export interface OfficialExternalRedirectMetadata {
  matchedUrl: string;
  target: string;
}

export function resolveOfficialExternalRedirect(
  url: string,
  mdnHost = DEFAULT_MDN_HOST,
  fallbackToEnUs = false
): string | void {
  let sourceUrl: URL;
  try {
    sourceUrl = new URL(url);
  } catch {
    return;
  }
  if (sourceUrl.hostname !== mdnHost) {
    return;
  }
  let target = officialExternalRedirects[sourceUrl.pathname];
  if (!target && fallbackToEnUs &&
    !officialExternalRedirectFallbackExclusions[sourceUrl.pathname]) {
    const localeEnd = sourceUrl.pathname.indexOf('/', 1);
    if (localeEnd !== -1 &&
      sourceUrl.pathname.slice(1, localeEnd) !== 'en-US') {
      target = officialExternalRedirects[
        '/en-US' + sourceUrl.pathname.slice(localeEnd)
      ];
    }
  }
  if (!target || !sourceUrl.hash) {
    return target;
  }
  const targetUrl = new URL(target);
  if (targetUrl.hash) {
    return target;
  }
  targetUrl.hash = sourceUrl.hash;
  return targetUrl.toString();
}

export function applyOfficialExternalRedirect(
  res: Resource,
  target: string,
  matchedUrl: string
): Resource {
  // Replace the source link with the real destination, but never mirror the
  // external page or its asset graph into the offline archive.
  res.replacePath = target;
  res.replaceUri = URI(target);
  res.shouldBeDiscardedFromDownload = true;
  res.meta.mdnOfficialExternalRedirect = {
    matchedUrl,
    target
  } satisfies OfficialExternalRedirectMetadata;
  skipExternalLogger.info(
    'skipped official external redirect',
    matchedUrl,
    target,
    res.refUrl
  );
  return res;
}

export function processOfficialExternalRedirect(
  res: Resource,
  element: Cheerio | null,
  parent: Resource | null,
  options: StaticDownloadOptions
): Resource {
  const mdnHost = options.meta.host as string | void || DEFAULT_MDN_HOST;
  const target = resolveOfficialExternalRedirect(res.url, mdnHost, true);
  if (!target) {
    return res;
  }
  return applyOfficialExternalRedirect(res, target, res.url);
}
