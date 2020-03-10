const {Resource, CssResource} = require('./link');

/**
 * @param {string} url
 * @param {Resource} base
 * @return {Resource}
 */
const createCssResourceFromUrl = (url, base) => {
  if (url.endsWith('.css')) {
    return new CssResource(url, base.localRoot, base.url, base.options);
  } else {
    return new Resource(url, base.localRoot, base.url, base.options);
  }
};

/**
 *
 * @param {CssResource} css
 * @return {Resource[]}
 */
const processCss = async (css) => {
  if (!(css instanceof CssResource)) {
    throw new TypeError('css not instanceof CssResource');
  }
  if (!css.urls) {
    await css.fetch();
  }
  return css.urls.map(url => {
    const link = url && css.options.linkRedirectFunc ?
      css.options.linkRedirectFunc(url, null, css) : url;
    let r = createCssResourceFromUrl(link, css);
    if (css.options.preProcessResource) {
      css.options.preProcessResource(link, null, r, css);
    }
    css.body = css.body.split(url).join(r.replacePath.toString());
    return r;
  });
};

module.exports = processCss;
module.exports.createCssResourceFromUrl = createCssResourceFromUrl;
