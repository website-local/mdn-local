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
   * @type number
   */
  concurrency: 600
};
module.exports = defaultOptions;