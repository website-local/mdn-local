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
  extractMdnAssets,
  postProcessMdnAssets,
  preProcessMdnAssets
} from './process-mdn-assets.js';
import {preProcessReactData} from './process-react-data.js';
import {
  postProcessJsPolyFill,
  preProcessJsPolyFill
} from './process-js-polyfill.js';
import {
  preProcessRemoveCompatibilityTableWarning
} from './process-compatibility-table.js';
import {
  postProcessAddIconToExternalLinks,
  postProcessReplaceExternalIframeWithLink,
  postProcessReplaceExternalImgWithLink,
  postProcessReplaceExternalMediaWithLink,
  postProcessReplaceExternalScriptWithLink,
  preProcessAddIconToExternalLinks
} from './process-external.js';
import {preProcessRemoveElements} from './process-remove-elements.js';
import type {ProcessYariDataResult} from './process-yari-data.js';
import {
  downloadAndRenderYariCompatibilityData,
  preProcessYariData,
  preProcessYariHydrationData
} from './process-yari-data.js';
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
  preProcessRemoveElements($);
  // the script containing inline data
  let dataScript: Cheerio | null = null;
  let yariCompatibilityData: ProcessYariDataResult | void = undefined;
  let isYariDocs = false;
  let assetsData;
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
        continue;
      }
      // mdn.assets
      if ((assetsData = extractMdnAssets(text)) &&
        ({assetsData} = assetsData) && assetsData) {
        preProcessMdnAssets($, text, assetsData);
        dataScript = elem;
        continue;
      }
      // js polyfill
      if (text.includes('document.write') && text.includes('js-polyfill')) {
        preProcessJsPolyFill($, text);
        continue;
      }
      if (text.includes('window._react_data')) {
        preProcessReactData(text, elem);
        dataScript = elem;
        continue;
      }
      if (text.includes('window.__data__')) {
        if (yariCompatibilityData) {
          error.warn('preProcessHtml: multiple yari data found', res.url);
        }
        yariCompatibilityData = preProcessYariData(text, elem);
        dataScript = elem;
        isYariDocs = true;
      }
      if (elem.attr('id') === 'hydration' &&
        elem.attr('type') === 'application/json') {
        if (yariCompatibilityData) {
          error.warn('preProcessHtml: multiple yari data found', res.url);
        }
        yariCompatibilityData = preProcessYariHydrationData(text, elem);
        dataScript = elem;
        isYariDocs = true;
      }
    }
  }

  // We're converting our compatibility data into a machine-readable JSON format.
  preProcessRemoveCompatibilityTableWarning($);
  // not needed in yari
  if (!isYariDocs) {
    // Add icon to external links
    preProcessAddIconToExternalLinks($);
  }

  // https://github.com/website-local/mdn-local/issues/888
  // https://github.com/website-local/mdn-local/issues/974
  // https://github.com/website-local/mdn-local/issues/1105
  await preProcessPlayground(res, submit, options, pipeline, $);

  /// region inject external script and style
  if (dataScript?.length) {
    // language=HTML
    $(`<script class="mdn-local-inject-js" src="${INJECT_JS_PATH}"></script>`)
      .insertAfter(dataScript);
    // language=HTML
    $(`<link href="${INJECT_CSS_PATH}" rel="stylesheet" \
type="text/css" class="mdn-local-inject-css">`)
      .appendTo($('head'));
  }
  /// endregion inject external script and style

  // download and render yari browser-compatibility-table
  try {
    await downloadAndRenderYariCompatibilityData(
      res, submit, pipeline,
      $, dataScript, yariCompatibilityData,
      options.meta.locale as string
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

  let isYariDocs = false;

  $('script').each((index, el) => {
    let text: string | null;
    const elem = $(el);
    const src = elem.attr('src');
    // remove main script chunk
    // /static/js/2.bffd2cab.chunk.js
    // /static/js/main.71bcbe14.chunk.js
    if (src && src.endsWith('.chunk.js') && (
      src.match(/\/\d+\./) || src.includes('/main.')
    )) {
      elem.remove();
      return;
    }
    // /static/js/main.e9205f9f.js
    // new since 20220717
    if (src && src.match(/\/main\.[0-9a-fA-F]+\.js$/)) {
      elem.remove();
      return;
    }
    if (!(text = elem.html())) {
      return;
    }
    // See https://github.com/mdn/yari/pull/2387
    if (text.includes('polyfill.io/v3/polyfill.min.js')) {
      elem.remove();
      return;
    }
    if (text.includes('document.write') && text.includes('js-polyfill')) {
      postProcessJsPolyFill($, elem, text);
      return;
    }
    if (text.includes('window.__data__')) {
      isYariDocs = true;
      return;
    }
    postProcessMdnAssets(text, $, elem);
  });

  if (isYariDocs) {
    postProcessAddIconToExternalLinks($);
  }
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

