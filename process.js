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
  const htmlArr = [];
  const resArr = [];
  if (typeof html.options.preProcessHtml === 'function') {
    html.doc = html.options.preProcessHtml(html.doc, html);
  }
  for (const {selector, attr, type} of sources) {
    const elements = html.doc(selector);
    for (let index = 0; index < elements.length; index++) {
      const elem = elements.eq(index);
      const link = elem.attr(attr);
      if (!link || link[0] === '#') {
        continue;
      }
      if (type === 'html') {
        const res = new HtmlResource(link, html.localRoot, html.url, html.options);
        htmlArr.push(res);
        elem.attr(attr, res.replacePath);
        continue;
      }
      const res = new Resource(link, html.localRoot, html.url, html.options);
      resArr.push(res);
      elem.attr(attr, res.replacePath);
    }
  }
  if (typeof html.options.postProcessHtml === 'function') {
    html.doc = html.options.postProcessHtml(html.doc, html);
  }
  return {htmlArr, resArr};
};

module.exports = process;