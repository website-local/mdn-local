import {
  createLog4jsLogger
} from 'website-scrap-engine/lib/logger/log4js-adapter.js';
import type {StaticDownloadOptions} from 'website-scrap-engine/lib/options.js';

export function createMdnLogger(options: StaticDownloadOptions) {
  return createLog4jsLogger(options.localRoot, options.logSubDir);
}
