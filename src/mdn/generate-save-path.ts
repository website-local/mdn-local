import {createHash} from 'node:crypto';
import {generateSavePath} from 'website-scrap-engine/lib/resource.js';
import type {GenerateSavePathFn} from 'website-scrap-engine/lib/resource.js';

export const generateMdnSavePath: GenerateSavePathFn = (
  uri, isHtml, keepSearch, localSrcRoot
) => {
  // BCD query names are case-sensitive. Preserve their request URLs, but give
  // each response a portable filename on case-insensitive filesystems.
  if (uri.hostname() === 'developer.mozilla.org' &&
    /^\/bcd\/api\/v0\/current\/[^/]+\.json$/.test(uri.path())) {
    const filename = uri.filename();
    const digest = createHash('sha256').update(filename).digest('hex').slice(0, 8);
    const savedUri = uri.clone().filename(`${filename.slice(0, -5)}-${digest}.json`);
    return generateSavePath(savedUri, isHtml, keepSearch, localSrcRoot);
  }
  return generateSavePath(uri, isHtml, keepSearch, localSrcRoot);
};
