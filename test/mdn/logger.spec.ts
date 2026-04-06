import {describe, expect, test} from '@jest/globals';
import type {StaticDownloadOptions} from 'website-scrap-engine/lib/options.js';
import {createMdnLogger} from '../../src/mdn/logger.js';

describe('logger', function () {
  test('uses the website-scrap-engine log4js adapter', () => {
    const logger = createMdnLogger({
      localRoot: '/tmp/mdn-local',
      logSubDir: 'developer.mozilla.org'
    } as StaticDownloadOptions);

    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.isTraceEnabled).toBe('function');
  });
});
