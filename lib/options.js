const adjust = require('./adjust-concurrency');
const log4js = require('log4js');
const logger = {
  error: log4js.getLogger('error')
};

const MAX_RETRY = 25;
const MAX_RETRY_DELAY = 5000;
const MAX_RETRY_AFTER = 60000;
/**
 * @type {Partial<DownloaderOptions>}
 */
const defaultOptions = {
  req: {
    maxRedirects: 15,
    // RequestError: Cookie has domain set to a public suffix
    // https://developer.mozilla.org/zh-CN/docs/Mozilla/QA/Marionette/Client
    ignoreInvalidCookies: true,
    retry: {
      decompress: true,
      limit: MAX_RETRY,
      maxRetryAfter: MAX_RETRY_AFTER,
      /**
       * if you would like to implement it yourself,
       * set error.retryLimitExceeded to 1 or true if
       * attemptCount > retryOptions.limit
       */
      calculateDelay: ({attemptCount, retryOptions, error}) => {
        if (attemptCount > retryOptions.limit) {
          error.retryLimitExceeded = 1;
          return 0;
        }
        const hasMethod = error.options &&
          retryOptions.methods.includes(error.options.method);
        const hasErrorCode = Reflect.has(error, 'code') &&
          (retryOptions.errorCodes.includes(error.code) ||
            'ERR_STREAM_PREMATURE_CLOSE' === error.code ||
            'ESERVFAIL' === error.code);
        const hasStatusCode = retryOptions.statusCodes &&
          error.response &&
          retryOptions.statusCodes.includes(error.response.statusCode);
        if (!hasMethod || (!hasErrorCode && !hasStatusCode && error.name !== 'ReadError')) {

          if (error && !((error.name === 'HTTPError' &&
            error.response && error.response.statusCode === 404))) {
            logger.error.error('calculateDelay SKIPPED',
              error.name, error.code, error.event, error.message,
              error.response && error.response.statusCode);
          }
          return 0;
        }
        let delay = ((2 * (attemptCount - 1)) * 1000) + Math.random() * 200;
        if (attemptCount > 2) {
          delay += 1000;
        }
        if (delay > MAX_RETRY_DELAY) {
          delay = MAX_RETRY_DELAY + (Math.random() - 0.5) * 1000;
        }
        // 429 Too Many Requests
        if (error.name === 'HTTPError' &&
          error.response && error.response.statusCode === 429) {
          // add random delay
          delay += 3000 + Math.random() * 3000;
          if (error.response.headers &&
            error.response.headers['retry-after']) {
            let retryAfter = parseInt(error.response.headers['retry-after']);
            if (Number.isNaN(retryAfter)) {
              retryAfter = Date.parse(error.response.headers['retry-after']) - Date.now();
            } else {
              retryAfter *= 1000;
            }
            if (!isNaN(retryAfter)) {
              retryAfter |= 0;
              if (retryOptions.maxRetryAfter) {
                if (retryAfter <= retryOptions.maxRetryAfter) {
                  delay = retryAfter;
                }
              } else {
                delay = retryAfter;
              }
            }
          }
        }
        delay |= 0;
        return delay;
      }
    },
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36',
      'dnt': 1
    },
    timeout: {
      lookup: 1000,
      connect: 3500,
      secureConnect: 4000,
      send: 3000,
      socket: 5000,
      response: 190000,
      request: 200000
    }
  },
  encoding: {
    buffer: null,
    html: 'utf8',
    css: 'utf8'
  },
  /**
   * @param {string} url
   * @type null | void | function(string): string
   */
  urlFilter: (url) => url,
  /**
   * @type boolean
   */
  cacheUri: false,
  /**
   * @type null | void | function(string, Cheerio, HtmlResource): string | Promise<string>
   */
  detectLinkType: null,
  /**
   * @type null | void | function(CheerioStatic, HtmlResource): CheerioStatic
   */
  preProcessHtml: null,
  /**
   * @type null | void | function(CheerioStatic, HtmlResource): CheerioStatic
   */
  postProcessHtml: null,
  /**
   * @type * | function(string, Cheerio, HtmlResource): string
   */
  linkRedirectFunc: null,
  /**
   * @type * | function(string, Cheerio, HtmlResource): boolean
   */
  skipProcessFunc: null,
  /**
   * @type * | function(string, Link): string
   */
  requestRedirectFunc: null,
  /**
   * @type * | function(string, Link): string | void
   */
  redirectFilterFunc: null,
  /**
   * @type * | function(Resource): boolean
   */
  dropResourceFunc: null,
  /**
   * @type number
   */
  concurrency: 12,
  /**
   * @type number
   */
  minConcurrency: 4,
  /**
   * @type number
   */
  depth: 5,
  beginUrl: '',
  localRoot: '',
  detectIncompleteHtml: '</body>',
  /**
   * @type * | function
   */
  onSuccess: null,
  /**
   * @type * | function
   */
  onError: null,
  adjustConcurrencyPeriod: 60000,
  adjustConcurrencyFunc: adjust
};
module.exports = defaultOptions;
