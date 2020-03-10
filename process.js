const parseCssUrls = require('css-url-parser');
const sources = require('./sources');
const {Resource, HtmlResource, CssResource} = require('./link');
const {createCssResourceFromUrl} = require('./process-css');

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
  let url = html.redirectedUrl || html.url;
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
      const originalLink = attr && elem.attr(attr);
      // skip empty, in-page hash jump, and data-uri links
      if (!originalLink || originalLink[0] === '#' ||
        originalLink.startsWith('data:') ||
        // skip mail links
        originalLink.toLowerCase().startsWith('mailto:')) {
        if (!originalLink && type === 'css-inline') {
          let content = elem.html();
          const cssUrls = parseCssUrls(content);
          resArr.push(...cssUrls.map(url => {
            const link = url && html.options.linkRedirectFunc ?
              html.options.linkRedirectFunc(url, elem, html) : url;
            let r = createCssResourceFromUrl(link, html);
            if (html.options.preProcessResource) {
              html.options.preProcessResource(link, elem, r, html);
            }
            content = content.split(url).join(r.replacePath.toString());
            return r;
          }));
          elem.html(content);
        }
        continue;
      }
      const link = originalLink && html.options.linkRedirectFunc ?
        html.options.linkRedirectFunc(originalLink, elem, html) : originalLink;
      if (!link || (html.options.skipProcessFunc &&
        html.options.skipProcessFunc(link, elem, html))) {
        continue;
      }
      const linkType = html.options.detectLinkType ?
        await html.options.detectLinkType(link, elem, html) || type : type;
      let Clazz = Resource;
      if (linkType === 'html') {
        const res = new HtmlResource(link, html.localRoot, url, html.options);
        res.depth = depth;
        if (!(typeof html.options.dropResourceFunc === 'function' &&
          html.options.dropResourceFunc(res))) {
          htmlArr.push(res);
        }
        const replacePath = res.replacePath.toString();
        if (replacePath === '.html' || replacePath === '/.html') {
          elem.attr(attr, '');
        } else {
          elem.attr(attr, replacePath);
        }
        if (html.options.preProcessResource) {
          html.options.preProcessResource(link, elem, res, html);
        }
        continue;
      } else if (linkType === 'css') {
        Clazz = CssResource;
      }
      const res = new Clazz(link, html.localRoot, url, html.options);
      res.depth = depth;
      if (!(typeof html.options.dropResourceFunc === 'function' &&
        html.options.dropResourceFunc(res))) {
        resArr.push(res);
      }
      if (html.options.preProcessResource) {
        html.options.preProcessResource(link, elem, res, html);
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
