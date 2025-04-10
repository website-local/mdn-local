import type {CheerioStatic} from 'website-scrap-engine/lib/types.js';

export const preProcessRemoveElements = ($: CheerioStatic): void => {
  $('.bc-github-link').remove();
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
  // Hacks Blog, new since maybe 20220109
  $('.home-content-container > .blog-feed').remove();
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
  // Found a problem with this page?
  // Source on GitHub
  $('#on-github').remove();
  $('script[src*="perf."]').remove();
  // bcd-signal script, not needed for offline usage
  $('script[src*="react-bcd-signal"]').remove();
  $('script[src*="speedcurve.com"]').remove();
  // google-analytics
  $('script[src*="google-analytics.com"]').remove();
  $('script[src*="/ga.js"]').remove();
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
  // remove google cdn stuff
  $('link[href*="googleapis.com"]').remove();
  $('script[src*="googleapis.com"]').remove();
  // This page was translated from English by the community.
  // Learn more and join the MDN Web Docs community.
  $('.localized-content-note').remove();
  // Change your language (bottom)
  $('.language-menu').remove();
  // Change language | View in English
  $('.language-toggle').remove();
  // 20220717 Latest news from hacks.mozilla.org on index page
  $('.latest-news').remove();
  // 20220717 Already a subscriber? Get MDN Plus
  $('.auth-container').remove();
  // 20220717 MDN Plus > FAQ
  $('#mdn-plus-button').parent().remove();
  // 20220717 Contributor Spotlight
  $('.contributor-spotlight').remove();
  // 20220717 language menu
  $('.languages-switcher-menu').remove();
  // 20220717 Recent contributions
  $('.recent-contributions').remove();
  // 20230716 sidebar Filter
  // 20250203 hide by default
  // https://github.com/website-local/mdn-local/issues/1020
  $('.sidebar-filter-container').addClass('hide');
  // 20230716 top nav
  $('a.top-level-entry.menu-link[href*="plus/ai-help"]').parent().remove();
  // 20230716 top banner
  $('.top-banner.loading').remove();
  // 20240303 baseline
  // https://github.com/website-local/mdn-local/issues/973
  $('.baseline-indicator a.learn-more').parent().remove();
  $('.baseline-indicator a.feedback-link').parent().remove();
  // 20240303 temporarily remove link to standalone play page
  // Part of https://github.com/website-local/mdn-local/issues/975
  // Would be reverted if this fully implemented
  $('a.top-level-entry.menu-link').each((i, el) => {
    const e = $(el);
    const href = e.attr('href');
    if (href?.endsWith('/play') && e.text().trim() === 'Play') {
      e.parent().remove();
    }
  });
  // 20241005 Tools
  // https://github.com/website-local/mdn-local/issues/1061
  $('#tools-button').parent().remove();
  // 20240503 Help improve MDN
  $('.article-footer-inner > .svg-container').remove();
  $('.article-footer-inner > h2').remove();
  $('.article-footer-inner > .feedback').remove();
  $('.article-footer-inner > .contribute').remove();
  $('.article-footer-inner').contents().filter(function (this) {
    return this.nodeType === 3 && this.data === '.';
  }).remove();
  // 20241006 blog newsletter
  // https://github.com/website-local/mdn-local/issues/1068
  $('.section-newsletter').remove();
};
