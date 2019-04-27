const sources = require('./sources');
const {Resource, HtmlResource} = require('./link');

/**
 *
 * @param {HtmlResource} html
 */
const process = async (html) => {
  if (!(html instanceof HtmlResource)) {
    throw new TypeError('html not instanceof HtmlResource');
  }
  if (!html.doc) {
    await html.fetch();
  }
  const depth = (+html.depth || 0) + 1;
  const htmlArr = [];
  const resArr = [];
  if (typeof html.options.preProcessHtml === 'function') {
    html.doc = html.options.preProcessHtml(html.doc, html);
  }
  for (const {selector, attr, type} of sources) {
    const elements = html.doc(selector);
    for (let index = 0; index < elements.length; index++) {
      const elem = elements.eq(index);
      const originalLink = elem.attr(attr);
      const link = html.options.linkRedirectFunc ?
        html.options.linkRedirectFunc(originalLink, elem, html) : originalLink;
      if (!link || link[0] === '#' ||
        link.startsWith('data:') ||
        link.toLowerCase().startsWith('mailto:')) {
        // skip empty, in-page hash jump, and data-uri links
        // skip mail links
        continue;
      }
      if (html.options.skipProcessFunc &&
        html.options.skipProcessFunc(link, elem, html)) {
        continue;
      }
      const linkType = html.options.detectLinkType ?
        await html.options.detectLinkType(link, elem, html) : type;
      if (linkType === 'html') {
        const res = new HtmlResource(link, html.localRoot, html.url, html.options);
        res.depth = depth;
        if (!(typeof html.options.dropResourceFunc === 'function' &&
          html.options.dropResourceFunc(res))) {
          htmlArr.push(res);
        }
        if (res.replacePath !== '.html') {
          elem.attr(attr, res.replacePath.toString());
        }
        continue;
      }
      const res = new Resource(link, html.localRoot, html.url, html.options);
      res.depth = depth;
      if (!(typeof html.options.dropResourceFunc === 'function' &&
        html.options.dropResourceFunc(res))) {
        resArr.push(res);
      }
      elem.attr(attr, res.replacePath.toString());
    }
  }
  if (typeof html.options.postProcessHtml === 'function') {
    html.doc = html.options.postProcessHtml(html.doc, html);
  }
  return {htmlArr, resArr};
};

module.exports = process;