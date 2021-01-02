import {
  extractMdnAssets,
  postProcessMdnAssets,
  preProcessMdnAssets
} from './process-mdn-assets';
import {Resource} from 'website-scrap-engine/lib/resource';
import URI from 'urijs';
import {postProcessReactData} from './process-react-data';
import {
  postProcessJsPolyFill,
  preProcessJsPolyFill
} from './process-js-polyfill';
import {preProcessRemoveCompatibilityTableWarning} from './process-compatibility-table';
import {
  postProcessReplaceExternalIframeWithLink,
  postProcessReplaceExternalImgWithLink,
  postProcessReplaceExternalMediaWithLink,
  postProcessReplaceExternalScriptWithLink,
  preProcessAddIconToExternalLinks
} from './process-external';
import {CheerioStatic} from 'website-scrap-engine/lib/types';


export const preProcessHtml = ($: CheerioStatic, html: Resource): CheerioStatic => {
  $('.bc-github-link').remove();
  if (!html.uri) {
    html.uri = URI(html.url);
  }
  if (!html.uri.path().startsWith('/interactive-examples/')) {
    $('.hidden').remove();
  }
  $('meta[name^="twitter"]').remove();
  $('meta[name^="og"]').remove();
  // head link to alternate lang
  $('link[rel="alternate"]').remove();
  $('link[rel="preconnect"]').remove();
  $('link[rel="canonical"]').remove();
  $('link[rel="manifest"]').remove();
  $('link[rel="search"]').remove();
  $('link[rel="apple-touch-icon-precomposed"]').remove();
  // notice on top of page
  $('.global-notice').remove();
  // page footer
  $('#nav-footer').remove();
  // newsletter box
  $('.newsletter-box').remove();
  $('.newsletter-container').remove();
  // Hacks Blog
  $('.column-hacks').remove();
  // login link
  $('#toolbox').remove();
  // locale
  $('.locale-container').remove();
  // script errors in this page
  $('#kserrors').remove();
  // login-related - not needed
  // $('.auth-container').remove();
  // This is an archived page. It's not actively maintained.
  $('.archived').remove();
  $('script[src*="perf."]').remove();
  // bcd-signal script, not needed for offline usage
  $('script[src*="react-bcd-signal"]').remove();
  $('script[src*="speedcurve.com"]').remove();
  // google-analytics
  $('script[src*="google-analytics.com"]').remove();
  // remove main script
  // /static/js/runtime-main.41503b2a.js
  $('script[src*="runtime-main."]').remove();
  // react-main script, still on index page
  $('script[src*="react-main."]').remove();
  // newsletter script, on the index page
  $('script[src*="newsletter"]').remove();
  // login box script, on the index page
  $('script[src*="auth-modal."]').remove();
  // remove styles on the index page
  $('link[rel="stylesheet"][href*="auth-modal."]').remove();
  $('link[rel="stylesheet"][href*="home_newsletter."]').remove();
  $('link[rel="stylesheet"][href*="subscriptions."]').remove();
  $('link[rel="stylesheet"][href*="home_featured."]').remove();
  $('link[rel="stylesheet"][href*="mdn-subscriptions."]').remove();
  $('link[rel="stylesheet"][href*="banners."]').remove();

  let assetsData, text;

  $('script').each((index, el) => {
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
    if ((text = elem.html())) {
      // google-analytics
      if (text.includes('google-analytics') ||
        text.includes('mdn.analytics.trackOutboundLinks') ||
        text.includes('Mozilla.dntEnabled()') ||
        text.includes('LUX=') ||
        // fetch polyfill not needed since it's mocked.
        text.includes('fetch-polyfill')) {
        return elem.remove();
      }
      // mdn.assets
      if ((assetsData = extractMdnAssets(text)) &&
        ({assetsData} = assetsData) && assetsData) {
        return preProcessMdnAssets($, text, assetsData);
      }
      // js polyfill
      if (text.includes('document.write') && text.includes('js-polyfill')) {
        preProcessJsPolyFill($, text);
      }
    }
  });
  // join community
  $('.communitybox').remove();
  // active-banner.jsx
  $('.developer-needs.mdn-cta-container').remove();
  // popup at bottom
  $('#contribution-popover-container').remove();
  // translation
  $('.translationInProgress').remove();
  // translation
  $('#doc-pending-fallback').remove();
  // We're converting our compatibility data into a machine-readable JSON format.
  preProcessRemoveCompatibilityTableWarning($);
  // Add icon to external links for new ui
  preProcessAddIconToExternalLinks($);
  // remove google cdn stuff
  $('link[href*="googleapis.com"]').remove();
  $('script[src*="googleapis.com"]').remove();
  return $;
};

export const postProcessHtml = ($: CheerioStatic): CheerioStatic => {
  $('script').each((index, el) => {
    let text: string | null;
    const elem = $(el);
    if (!(text = elem.html())) {
      return;
    }
    if (text.includes('window._react_data')) {
      postProcessReactData(text, elem);
      // $('#react-container').removeAttr('id');
      return;
    }
    if (text.includes('document.write') && text.includes('js-polyfill')) {
      return postProcessJsPolyFill($, elem, text);
    }
    postProcessMdnAssets(text, $, elem);
  });

  /// region inject external script and style
  const reactMainScript = $('script[src*="react-main"]');
  let src: string | void, pathArr: string[];
  if (reactMainScript && reactMainScript.length &&
    (src = reactMainScript.attr('src')) &&
    (pathArr = src.split('/')) && pathArr.length) {
    pathArr.pop();
    pathArr.push('inject.js');
    // sync script
    // language=HTML
    $(`<script class="mdn-local-inject-js" src="${pathArr.join('/')}"></script>`)
      .insertBefore(reactMainScript);
    pathArr.pop();
    pathArr.pop();
    pathArr.push('styles');
    pathArr.push('inject.css');
    // language=HTML
    $(`<link href="${pathArr.join('/')}" rel="stylesheet"\
 type="text/css" class="mdn-local-inject-css">`)
      .appendTo($('head'));
  }
  /// endregion inject external script and style

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

