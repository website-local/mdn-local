import type {
  DownloadResource,
  SubmitResourceFunc
} from 'website-scrap-engine/lib/life-cycle/types.js';
import {ResourceType} from 'website-scrap-engine/lib/resource.js';
import {toString} from 'website-scrap-engine/lib/util.js';
import type {StaticDownloadOptions} from 'website-scrap-engine/lib/options.js';

function replaceAll(str: string, s: string, r: string): string {
  return str.split(s).join(r);
}

const MAIN_CSS_REGEX = /\/main\.[0-9a-fA-F]+\.css$/;

// https://github.com/website-local/mdn-local/issues/785

export const processYariMainCss = (
  res: DownloadResource,
  submit: SubmitResourceFunc,
  options: StaticDownloadOptions,
): DownloadResource => {
  const mdnHost: string = options.meta.host as string | void
    || 'developer.mozilla.org';
  if (res.type !== ResourceType.Css ||
    !(res.uri?.host() === mdnHost && res.uri.path().includes('static/client') ||
      MAIN_CSS_REGEX.test(res.downloadLink))||
    res.savePath.endsWith('_file.css')) {
    return res;
  }
  let cssText = toString(res.body, res.encoding);
  const newRes = Object.assign({}, res);
  newRes.meta = Object.assign({}, res.meta);
  cssText = replaceAll(cssText, '-webkit-mask-', '-webkit-background-');
  cssText = replaceAll(cssText, '-webkit-mask:', '-webkit-background:');
  cssText = replaceAll(cssText, 'mask-', 'background-');
  cssText = replaceAll(cssText, 'mask:', 'background:');
  newRes.body = cssText;
  newRes.savePath = res.savePath.replace(/\.css$/, '_file.css');
  // to bypass duplication check
  // this should be never downloaded from since body exists
  newRes.url = res.url.replace(/\.css$/, '_file.css');
  newRes.redirectedUrl = newRes.url;
  newRes.uri = undefined;
  submit(newRes);
  return res;
};
