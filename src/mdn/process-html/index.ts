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
  $('.mdn-wiki-notice').remove();
  // notice on top of page
  $('.global-notice').remove();
  // page footer
  $('#nav-footer').remove();
  $('.home-callouts').remove();
  // newsletter box
  $('.newsletter-box').remove();
  $('.newsletter-container').remove();
  // Hacks Blog
  $('.column-hacks').remove();
  // login link
  $('#toolbox').remove();
  // locale, edit, history
  $('.document-actions').remove();
  $('.dropdown-container').remove();
  // search box
  $('#nav-main-search').remove();
  $('#edit-history-menu').remove();
  $('.header-search').remove();
  $('.contributors-sub').remove();
  // script errors in this page
  $('#kserrors').remove();
  // head link to alternate lang
  $('link[rel="alternate"]').remove();
  $('link[rel="preconnect"]').remove();
  $('link[rel="canonical"]').remove();
  $('link[rel="search"]').remove();
  $('link[rel="apple-touch-icon-precomposed"]').remove();
  $('a[href$="$translate"]').remove();
  $('a[href$="$edit"]').remove();
  // no script mode ?
  // $('script').remove();
  // newsletter script
  $('script[src*="newsletter"]').remove();
  $('script[src*="auth-modal."]').remove();
  // remove styles
  $('link[rel="stylesheet"][href*="auth-modal."]').remove();
  $('link[rel="stylesheet"][href*="subscriptions."]').remove();
  $('link[rel="stylesheet"][href*="mdn-subscriptions."]').remove();
  $('link[rel="stylesheet"][href*="banners."]').remove();
  $('script[src*="perf."]').remove();
  // bcd-signal script, not needed for offline usage
  $('script[src*="react-bcd-signal"]').remove();
  $('script[src*="speedcurve.com"]').remove();
  // google-analytics
  $('script[src*="google-analytics.com"]').remove();
  let assetsData, text;

  $('script').each((index, el) => {
    const elem = $(el);
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
  // $('iframe').remove();
  $('iframe[src*="youtube.com/"]').remove();
  // Tag pagination discarded
  // https://github.com/myfreeer/mdn-local/issues/10
  $('.pagination').remove();
  // fix script
  // language=HTML
  $(`
    <div style="display:none" class="script-workaround">
      <div id="close-header-search"></div>
      <div id="nav-main-search"></div>
      <div id="main-q"></div>
    </div>`).appendTo($('#main-header'));
  // We're converting our compatibility data into a machine-readable JSON format.
  preProcessRemoveCompatibilityTableWarning($);
  // Add icon to external links for new ui
  preProcessAddIconToExternalLinks($);
  // keep href of red links by replacing class and fixup style
  $('article a.new')
    .removeClass('new')
    .addClass('mdn-local-red-link');

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
  return $;
};

