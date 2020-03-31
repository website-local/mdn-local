const parseCssUrls = require('css-url-parser');
const sources = require('./sources');
const {Resource, HtmlResource, CssResource} = require('./link');
const {createResourceFromCss} = require('./process-css');
const srcset = require('srcset');

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
  if (html.options.linkRedirectFunc) {
    url = html.options.linkRedirectFunc(url, null, html);
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
      let attrValue = attr && elem.attr(attr);
      if (!attrValue) {
        if (type === 'css-inline') {
          let content = elem.html();
          const cssUrls = parseCssUrls(content);
          for (let i = 0, l = cssUrls.length, url, r; i < l; i++) {
            url = cssUrls[i];
            if (!(r = createResourceFromCss(url, elem, html))) {
              continue;
            }
            content = content.split(url).join(r.replacePath.toString());
            resArr.push(r);
          }
          elem.html(content);
        }
        continue;
      }
      let links, replaceValue;
      if (attr === 'srcset') {
        replaceValue = srcset.parse(attrValue);
        links = replaceValue.map(e => e.url);
      } else {
        links = [attrValue];
        replaceValue = attrValue;
      }
      for (let linkIndex = 0, l = links.length; linkIndex < l; linkIndex++) {
        let originalLink = links[linkIndex];

        // skip empty, in-page hash jump, and data-uri links
        if (!originalLink || originalLink[0] === '#' ||
          originalLink.startsWith('data:') ||
          // skip mail links
          originalLink.toLowerCase().startsWith('mailto:')) {
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
          // not likely srcset here
          if (replacePath === '.html' || replacePath === '/.html') {
            replaceValue = '';
            elem.attr(attr, replaceValue);
          } else {
            replaceValue = replacePath;
            elem.attr(attr, replaceValue);
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
        if (attr === 'srcset') {
          replaceValue[linkIndex].url = res.replacePath.toString();
        } else {
          replaceValue = res.replacePath.toString();
        }
      }
      if (attr === 'srcset') {
        elem.attr(attr, srcset.stringify(replaceValue));
      } else {
        elem.attr(attr, replaceValue);
      }
    }
  }
  if (typeof html.options.postProcessHtml === 'function') {
    html.doc = html.options.postProcessHtml(html.doc, html);
  }
  return {htmlArr, resArr};
};

module.exports = process;
