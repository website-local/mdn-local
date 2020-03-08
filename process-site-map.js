const {HtmlResource, SiteMapResource} = require('./link');
const cheerio = require('cheerio');
/**
 *
 * @param {SiteMapResource} siteMap
 * @return {HtmlResource[]}
 */
const processSiteMap = async (siteMap) => {
  if (!(siteMap instanceof SiteMapResource)) {
    throw new TypeError('siteMap not instanceof SiteMapResource');
  }
  if (!siteMap.body) {
    await siteMap.fetch();
  }
  const $ = cheerio.load(siteMap.body);
  const urls = [];
  const depth = (+siteMap.depth || 0) + 1;
  // noinspection CssInvalidHtmlTagReference
  $('urlset url loc').each((index, obj) => {
    let url = $(obj).text();
    if (url && (url = url.trim())) {
      urls.push(url);
    }
  });
  const htmlArr = [];
  for (let url of urls) {

    if (siteMap.options.linkRedirectFunc) {
      url = siteMap.options.linkRedirectFunc(url, null, siteMap);
    }
    if (!url || (siteMap.options.skipProcessFunc &&
      siteMap.options.skipProcessFunc(url, null))) {
      continue;
    }
    let htmlResource = new HtmlResource(url,
      siteMap.localRoot, siteMap.refUrl, siteMap.options);
    htmlResource.depth = depth;
    if (!(typeof siteMap.options.dropResourceFunc === 'function' &&
      siteMap.options.dropResourceFunc(htmlResource))) {
      if (siteMap.options.preProcessResource) {
        siteMap.options.preProcessResource(url, null, htmlResource, siteMap);
      }
      htmlArr.push(htmlResource);
    }
  }
  return htmlArr;
};

module.exports = processSiteMap;