import {afterEach, describe, expect, jest, test} from '@jest/globals';
import {Options, RequestError} from 'got';
import type {RetryObject, RetryOptions} from 'got';
import Response from 'responselike';
import {calculateFastDelay, mergeOverrideOptions} from 'website-scrap-engine/lib/options.js';
import {getRetry} from 'website-scrap-engine/lib/life-cycle/download-resource.js';
import {calculateMdnRetryDelay} from '../../src/mdn/calculate-retry-delay.js';
import options from '../../src/mdn/life-cycle.js';

function context({
  attemptCount = 1, limit = 42, method = 'GET', code = 'ETIMEDOUT',
  name = 'RequestError', statusCode = 0, headers = {}, retry = {},
}: {
  attemptCount?: number; limit?: number; method?: string; code?: string;
  name?: string; statusCode?: number; headers?: Record<string, string>;
  retry?: Partial<RetryOptions>;
} = {}): RetryObject {
  const requestOptions = new Options({method, retry: {limit, ...retry}});
  const error = new RequestError('Synthetic failure', {code}, requestOptions);
  error.name = name;
  if (statusCode) Object.defineProperty(error, 'response', {value: {statusCode, headers}});
  return {attemptCount, error, retryOptions: requestOptions.retry as RetryOptions, computedValue: 0};
}

afterEach(() => jest.restoreAllMocks());

describe('minimum fast retry delay', () => {
  test.each([0, 0.004, 0.00499])('repairs first-retry jitter %s', async random => {
    jest.spyOn(Math, 'random').mockReturnValue(random);
    const args = context();
    expect(await calculateFastDelay(args)).toBe(0);
    expect(await calculateMdnRetryDelay(args)).toBe(1);
  });

  test.each([
    {limit: 0},
    {attemptCount: 43},
    {method: 'POST'},
    {name: 'HTTPError', code: 'ERR_NON_2XX_3XX_RESPONSE', statusCode: 404},
    {code: 'ERR_UNRETRYABLE_TEST'},
    {name: 'RetryError', code: 'ERR_RETRYING'},
  ])('preserves intentional stops: %j', async settings => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    expect(await calculateMdnRetryDelay(context(settings))).toBe(0);
  });

  test.each([
    {name: 'ReadError', code: 'ERR_READING_RESPONSE_STREAM'},
    {name: 'TimeoutError', code: 'CUSTOM_TIMEOUT'},
    {code: 'ESERVFAIL', retry: {errorCodes: []}},
    {code: 'ERR_STREAM_PREMATURE_CLOSE', retry: {errorCodes: []}},
    {retry: {methods: [], errorCodes: []}},
    {name: 'HTTPError', code: 'ERR_NON_2XX_3XX_RESPONSE', statusCode: 413},
    {name: 'HTTPError', code: 'ERR_NON_2XX_3XX_RESPONSE', statusCode: 503},
    {name: 'HTTPError', code: 'ERR_NON_2XX_3XX_RESPONSE', statusCode: 429,
      headers: {'retry-after': '0'}},
  ])('retains engine-specific retry eligibility: %j', async settings => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    expect(await calculateMdnRetryDelay(context(settings))).toBe(1);
  });

  test.each([
    {}, {attemptCount: 2}, {attemptCount: 3}, {attemptCount: 42},
    {name: 'HTTPError', code: 'ERR_NON_2XX_3XX_RESPONSE', statusCode: 429},
    {name: 'HTTPError', code: 'ERR_NON_2XX_3XX_RESPONSE', statusCode: 429,
      headers: {'retry-after': '2'}},
  ])('preserves positive engine delays: %j', async settings => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const args = context(settings);
    const expected = await calculateFastDelay(args);
    expect(expected).toBeGreaterThan(0);
    expect(await calculateMdnRetryDelay(args)).toBe(expected);
  });
});

describe('retry options through the real request helper', () => {
  test.each([
    {scenario: 'recover', limit: 42, requests: 2, retries: 1},
    {scenario: 'timeout', limit: 0, requests: 1, retries: 0},
    {scenario: 'timeout', limit: 1, requests: 2, retries: 1},
    {scenario: '404', limit: 42, requests: 1, retries: 0},
  ])('$scenario with limit $limit', async entry => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const beforeRetry = jest.fn();
    const request = jest.fn((url: URL) => {
      if (entry.scenario === 'timeout' ||
        entry.scenario === 'recover' && request.mock.calls.length === 1) {
        throw Object.assign(new Error('Synthetic connection timeout'), {code: 'ETIMEDOUT'});
      }
      return new Response({statusCode: entry.scenario === '404' ? 404 : 200,
        headers: {}, body: Buffer.from('response'), url: String(url)});
    });
    const merged = mergeOverrideOptions(options, {localRoot: '/unused', req: {
      retry: {limit: entry.limit}, request, hooks: {beforeRetry: [beforeRetry]},
    }});
    expect(merged.req.retry?.calculateDelay).toBe(calculateMdnRetryDelay);
    const result = getRetry('https://retry.invalid/', merged.req);
    if (entry.scenario === 'recover') await expect(result).resolves.toHaveProperty('statusCode', 200);
    else await expect(result).rejects.toHaveProperty('code',
      entry.scenario === '404' ? 'ERR_NON_2XX_3XX_RESPONSE' : 'ETIMEDOUT');
    expect(request).toHaveBeenCalledTimes(entry.requests);
    expect(beforeRetry).toHaveBeenCalledTimes(entry.retries);
  });
});
