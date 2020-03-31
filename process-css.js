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
  let resources = [];
  for (let i = 0, l = css.urls.length, url, r; i < l; i++) {
    url = css.urls[i];
    const link = url && css.options.linkRedirectFunc ?
      css.options.linkRedirectFunc(url, null, css) : url;
    if (!url || (css.options.skipProcessFunc &&
      css.options.skipProcessFunc(url, null, css))) {
      continue;
    }
    r = createCssResourceFromUrl(link, css);

    if (css.options.preProcessResource) {
      css.options.preProcessResource(link, null, r, css);
    }

    css.body = css.body.split(url).join(r.replacePath.toString());
    resources.push(r);
  }
  return resources;
};

module.exports = processCss;
module.exports.createCssResourceFromUrl = createCssResourceFromUrl;
