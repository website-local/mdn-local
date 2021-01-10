import {Cheerio, CheerioStatic} from 'website-scrap-engine/lib/types';
import {
  DownloadResource,
  SubmitResourceFunc
} from 'website-scrap-engine/lib/life-cycle/types';
import {
  PipelineExecutor
} from 'website-scrap-engine/lib/life-cycle/pipeline-executor';
import {ResourceType} from 'website-scrap-engine/lib/resource';
import {parseHtml} from 'website-scrap-engine/lib/life-cycle/adapters';
import {error} from 'website-scrap-engine/lib/logger/logger';
import {
  extractMdnAssets,
  postProcessMdnAssets,
  preProcessMdnAssets
} from './process-mdn-assets';
import {preProcessReactData} from './process-react-data';
import {
  postProcessJsPolyFill,
  preProcessJsPolyFill
} from './process-js-polyfill';
import {
  preProcessRemoveCompatibilityTableWarning
} from './process-compatibility-table';
import {
  postProcessReplaceExternalIframeWithLink,
  postProcessReplaceExternalImgWithLink,
  postProcessReplaceExternalMediaWithLink,
  postProcessReplaceExternalScriptWithLink,
  preProcessAddIconToExternalLinks
} from './process-external';
import {preProcessRemoveElements} from './process-remove-elements';
import {
  preProcessYariData,
  downloadAndRenderYariCompatibilityData, ProcessYariDataResult
} from './process-yari-data';
import {StaticDownloadOptions} from 'website-scrap-engine/lib/options';

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
  preProcessRemoveElements($);
  // the script containing inline data
  let dataScript: Cheerio | null = null;
  let yariCompatibilityData: ProcessYariDataResult;
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
      }
    }
  }

  // We're converting our compatibility data into a machine-readable JSON format.
  preProcessRemoveCompatibilityTableWarning($);
  // Add icon to external links for new ui
  preProcessAddIconToExternalLinks($);

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
      $, dataScript, yariCompatibilityData);
  } catch (e) {
    error.error('Error processing yari browser-compatibility-table', e, res.url);
  }
  return res;
};

export const postProcessHtml = ($: CheerioStatic): CheerioStatic => {
  // remove scripts in postProcessHtml,
  // to keep a copy of scripts and source maps
  // remove main script
  // /static/js/runtime-main.41503b2a.js
  $('script[src*="runtime-main."]').remove();
  // react-main script, still on index page
  $('script[src*="react-main."]').remove();

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
      return elem.remove();
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
      return postProcessJsPolyFill($, elem, text);
    }
    postProcessMdnAssets(text, $, elem);
  });

  // replace external iframe with external links
  postProcessReplaceExternalIframeWithLink($);
  // replace external img with external links
  postProcessReplaceExternalImgWithLink($);
  // replace external audio and video with external links
  postProcessReplaceExternalMediaWithLink($);
  // replace external script with external links
  postProcessReplaceExternalScriptWithLink($);
  return $;
};

