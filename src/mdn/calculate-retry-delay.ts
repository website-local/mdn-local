import got from 'got';
import type {RetryFunction} from 'got';
import {calculateFastDelay} from 'website-scrap-engine/lib/options.js';

const fallbackErrorCodes = new Set([
  ...(got.defaults.options.retry.errorCodes || []),
  'ERR_STREAM_PREMATURE_CLOSE', 'ESERVFAIL',
]);

// Temporary website-scrap-engine 0.x workaround: first-retry jitter can round
// down to zero, which Got interprets as "stop". Remove after upgrading to the
// next major engine release containing the upstream fix.
export const calculateMdnRetryDelay: RetryFunction = async context => {
  const delay = await calculateFastDelay(context);
  const {attemptCount, retryOptions, error} = context;
  if (delay !== 0 || attemptCount > retryOptions.limit) return delay;

  // Zero also represents an intentional stop. Check only eligibility here;
  // keep the engine's backoff, jitter and Retry-After calculation untouched.
  const method = error.options?.method;
  if (!method || !(retryOptions.methods.length
    ? retryOptions.methods.includes(method) : method === 'GET')) return 0;
  const retryableCode = retryOptions.errorCodes.length
    ? retryOptions.errorCodes.includes(error.code) : fallbackErrorCodes.has(error.code);
  const retryableStatus = error.response &&
    retryOptions.statusCodes.includes(error.response.statusCode);
  return retryableCode || retryableStatus ||
    error.name === 'ReadError' || error.name === 'TimeoutError' ? 1 : 0;
};
