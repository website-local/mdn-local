// https://github.com/website-scraper/node-website-scraper
// /blob/a6f989a59e3a665b562f0f38a691aa1cc40557f9/lib/config/defaults.js
const sources = [
  {selector: 'style', type: 'css-inline'},
  // {selector: '[style]', attr: 'style', type: 'css'},
  {selector: 'img', attr: 'src'},
  {selector: 'img', attr: 'srcset'},
  {selector: 'input', attr: 'src'},
  {selector: 'object', attr: 'data'},
  {selector: 'embed', attr: 'src'},
  {selector: 'param[name="movie"]', attr: 'value'},
  {selector: 'script', attr: 'src'},
  {selector: 'link[rel="stylesheet"]', attr: 'href', type: 'css'},
  {selector: 'link[rel*="icon"]', attr: 'href'},
  {selector: 'link[rel*="preload"]', attr: 'href'},
  {selector: 'svg *[xlink\\:href]', attr: 'xlink:href'},
  {selector: 'svg *[href]', attr: 'href'},
  {selector: 'picture source', attr: 'srcset'},
  {selector: 'meta[property="og\\:image"]', attr: 'content'},
  {selector: 'meta[property="og\\:image\\:url"]', attr: 'content'},
  {selector: 'meta[property="og\\:image\\:secure_url"]', attr: 'content'},
  {selector: 'meta[property="og\\:audio"]', attr: 'content'},
  {selector: 'meta[property="og\\:audio\\:url"]', attr: 'content'},
  {selector: 'meta[property="og\\:audio\\:secure_url"]', attr: 'content'},
  {selector: 'meta[property="og\\:video"]', attr: 'content'},
  {selector: 'meta[property="og\\:video\\:url"]', attr: 'content'},
  {selector: 'meta[property="og\\:video\\:secure_url"]', attr: 'content'},
  {selector: 'video', attr: 'src'},
  {selector: 'video source', attr: 'src'},
  {selector: 'video track', attr: 'src'},
  {selector: 'audio', attr: 'src'},
  {selector: 'audio source', attr: 'src'},
  {selector: 'audio track', attr: 'src'},
  {selector: 'frame', attr: 'src', type: 'html'},
  {selector: 'iframe', attr: 'src', type: 'html'},
  {selector: 'a', attr: 'href', type: 'html'}
].map(obj => {
  if (!obj.selector.startsWith('svg') && obj.attr)
    obj.selector += `[${obj.attr}]`;
  return obj;
});

module.exports = sources;
