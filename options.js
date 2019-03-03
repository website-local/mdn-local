const defaultOptions = {
  req: {
    retry : 20,
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36'
    },
    timeout: {
      lookup: 1000,
      connect: 600,
      secureConnect: 1000
    }
  },
  encoding: {
    buffer: null,
    html: 'utf8'
  },
  /**
   * @type null | void | function(string): string
   */
  urlFilter: (url) => url,
  /**
   * @type boolean
   */
  cacheUri: false,
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
   * @type * | function(Resource): boolean
   */
  dropResourceFunc: null,
  /**
   * @type number
   */
  concurrency: 16,
  /**
   * @type number
   */
  depth: 5,
  beginUrl: '',
  localRoot: '',
  /**
   * @type * | function
   */
  onSuccess: null,
  /**
   * @type * | function
   */
  onError: null
};
module.exports = defaultOptions;