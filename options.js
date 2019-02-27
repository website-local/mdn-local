const defaultOptions = {
  req: {
    retry : 100
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
  concurrency: 32,
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