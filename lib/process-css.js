const {Resource, CssResource} = require('./link');

/**
 * @param {string} url
 * @param {Resource} base
 * @return {Promise<Resource | CssResource>}
 */
const createCssResourceFromUrl = async (url, base) => {
  let refUrl = base.redirectedUrl || base.url;
  if (base.options.linkRedirectFunc) {
    url = await base.options.linkRedirectFunc(url, null, base);
    refUrl = await base.options.linkRedirectFunc(refUrl, null, base);
  }
  if (url.endsWith('.css')) {
    return new CssResource(url, base.localRoot, refUrl, base.options);
  } else {
    return new Resource(url, base.localRoot, refUrl, base.options);
  }
};

/**
 * @param {string} url
 * @param {null | Cheerio} elem
 * @param {HtmlResource | CssResource} parent
 * @return {Promise<Resource | CssResource>}
 */
const createResourceFromCss = async (url, elem, parent) => {
  const link = url && parent.options.linkRedirectFunc ?
    (await parent.options.linkRedirectFunc(url, elem, parent)) : url;
  if (!url || (parent.options.skipProcessFunc &&
    parent.options.skipProcessFunc(url, elem, parent))) {
    return null;
  }
  let r = await createCssResourceFromUrl(link, parent);

  if (parent.options.preProcessResource) {
    parent.options.preProcessResource(link, elem, r, parent);
  }
  return r;
};

/**
 *
 * @param {CssResource} css
 * @return {Promise<Resource[]>}
 */
const processCss = async (css) => {
  if (!(css instanceof CssResource)) {
    throw new TypeError('css not instanceof CssResource');
  }
  if (!css.urls) {
    await css.fetch();
  }
  let resources = [];
  for (let i = 0, l = css.urls.length, url, r; i < l; i++) {
    url = css.urls[i];
    if (!(r = await createResourceFromCss(url, null, css))) {
      continue;
    }
    css.body = css.body.split(url).join(r.replacePath.toString());
    resources.push(r);
  }
  return resources;
};

module.exports = processCss;
module.exports.createCssResourceFromUrl = createCssResourceFromUrl;
module.exports.createResourceFromCss = createResourceFromCss;
