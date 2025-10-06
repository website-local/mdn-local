import type {Cheerio, CheerioStatic} from 'website-scrap-engine/lib/types.js';
import type {
  DownloadResource,
  SubmitResourceFunc
} from 'website-scrap-engine/lib/life-cycle/types.js';
import type {
  PipelineExecutor
} from 'website-scrap-engine/lib/life-cycle/pipeline-executor.js';
import {parseHtml} from 'website-scrap-engine/lib/life-cycle/adapters.js';
import type {Resource} from 'website-scrap-engine/lib/resource.js';
import {ResourceType} from 'website-scrap-engine/lib/resource.js';
import {error} from 'website-scrap-engine/lib/logger/logger.js';
import type {StaticDownloadOptions} from 'website-scrap-engine/lib/options.js';
import {
  postProcessAddIconToExternalLinks,
  postProcessReplaceExternalIframeWithLink,
  postProcessReplaceExternalImgWithLink,
  postProcessReplaceExternalMediaWithLink,
  postProcessReplaceExternalScriptWithLink,
} from './process-external.js';
import {preProcessRemoveElements} from './process-remove-elements.js';
import {
  downloadAndRenderCompatibilityData,
} from './process-compat-table.js';
import {preProcessPlayground} from './process-playground.js';
import {postProcessPlayable, preProcessPlayable} from './process-playable.js';
import {
  postProcessInteractiveExample,
  preProcessInteractiveExample
} from './process-new-interactive-examples.js';

const INJECT_JS_PATH = '/static/js/inject.js';
const INJECT_CSS_PATH = '/static/css/inject.css';

export const preProcessHtml = async (
  res: DownloadResource,
  submit: SubmitResourceFunc,
  options: StaticDownloadOptions,
  pipeline: PipelineExecutor
): Promise<DownloadResource> => {
  if (res.type !== ResourceType.Html) {
    return res;
  }
  if (!res.meta.doc) {
    res.meta.doc = parseHtml(res, options);
  }
  const $: CheerioStatic = res.meta.doc;
  // keep the copyright notice
  // class name updated on 2022
  // class name updated again on 2024
  $('#license.page-footer-legal-text')
    .insertAfter($('.article-footer-inner>.last-modified-date'));
  // 20251005 fred
  $('.footer__mozilla>p:last-child')
    .insertAfter($('.article-footer__last-modified'));
  preProcessRemoveElements($);
  const scripts = $('script');
  for (let i = 0; i < scripts.length; i++) {
    const elem: Cheerio = $(scripts[i]);

    let text: string | null;
    if ((text = elem.html())) {
      // google-analytics
      if (text.includes('google-analytics') ||
        text.includes('mdn.analytics.trackOutboundLinks') ||
        text.includes('Mozilla.dntEnabled()') ||
        text.includes('LUX=') ||
        // fetch polyfill not needed since it's mocked.
        text.includes('fetch-polyfill')) {
        elem.remove();
      }
    }
  }

  // https://github.com/website-local/mdn-local/issues/888
  // https://github.com/website-local/mdn-local/issues/974
  // https://github.com/website-local/mdn-local/issues/1105
  await preProcessPlayground(res, submit, options, pipeline, $);

  /// region inject external script and style
  // language=HTML
  $(`<script class="mdn-local-inject-js" src="${INJECT_JS_PATH}"></script>`)
    .insertAfter($('body'));
  // language=HTML
  $(`<link href="${INJECT_CSS_PATH}" rel="stylesheet" \
type="text/css" class="mdn-local-inject-css">`)
    .appendTo($('head'));
  /// endregion inject external script and style

  // download and render yari browser-compatibility-table
  try {
    await downloadAndRenderCompatibilityData(
      res, submit, pipeline, options,
      $, options.meta.locale as string
    );
  } catch (e) {
    error.error('Error processing yari browser-compatibility-table', e, res.url);
  }

  // https://github.com/website-local/mdn-local/issues/930
  if (res.url.startsWith('https://developer.mozilla.org/mdn-github-io/')) {
    preProcessPlayable($);
  }
  // 20250323 new interactive examples
  // https://github.com/website-local/mdn-local/issues/1142
  preProcessInteractiveExample($);
  return res;
};

export const postProcessHtml = (
  $: CheerioStatic, res: Resource
): CheerioStatic => {
  // remove scripts in postProcessHtml,
  // to keep a copy of scripts and source maps
  // remove main script
  // /static/js/runtime-main.41503b2a.js
  $('script[src*="runtime-main."]').remove();
  // react-main script, still on index page
  $('script[src*="react-main."]').remove();
  // 20250203 gtag.js googletagmanager stuff
  $('script[src*="gtag.js"]').remove();
  // 20251005 module scripts not supported in file: protocol
  $('script[type="module"]').remove();

  postProcessAddIconToExternalLinks($);
  // replace external iframe with external links
  postProcessReplaceExternalIframeWithLink($, res.url);
  // replace external img with external links
  postProcessReplaceExternalImgWithLink($, res.url);
  // replace external audio and video with external links
  postProcessReplaceExternalMediaWithLink($, res.url);
  // replace external script with external links
  postProcessReplaceExternalScriptWithLink($, res.url);

  // https://github.com/website-local/mdn-local/issues/930
  if (res.url.startsWith('https://developer.mozilla.org/mdn-github-io/')) {
    postProcessPlayable($);
  }
  // 20250323 new interactive examples
  // https://github.com/website-local/mdn-local/issues/1142
  postProcessInteractiveExample($);
  return $;
};

