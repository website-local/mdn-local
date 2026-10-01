import type {CheerioStatic} from 'website-scrap-engine/lib/types.js';

export const preProcessRemoveElements = ($: CheerioStatic): void => {
  // These selectors only remove nodes; collect them in one document traversal.
  $([
    '.bc-github-link',
    'meta[name^="twitter"]',
    'meta[name^="og"]',
    // head link to alternate lang
    'link[rel="alternate"]',
    'link[rel="preconnect"]',
    'link[rel="canonical"]',
    'link[rel="manifest"]',
    'link[rel="search"]',
    'link[rel="apple-touch-icon-precomposed"]',
    // notice on top of page
    '.global-notice',
    // page footer
    '#nav-footer',
    // newsletter box
    '.newsletter-box',
    '.newsletter-container',
    // Hacks Blog
    '.column-hacks',
    // Hacks Blog, new since maybe 20220109
    '.home-content-container > .blog-feed',
    // login link
    '#toolbox',
    // locale
    '.locale-container',
    // script errors in this page
    '#kserrors',
    // login-related - not needed
    // $('.auth-container').remove();
    // This is an archived page. It's not actively maintained.
    '.archived',
    // Found a problem with this page?
    // Source on GitHub
    '#on-github',
    'script[src*="perf."]',
    // bcd-signal script, not needed for offline usage
    'script[src*="react-bcd-signal"]',
    'script[src*="speedcurve.com"]',
    'script[src*="transcend-cdn.com"]',
    // google-analytics
    'script[src*="google-analytics.com"]',
    'script[src*="/ga.js"]',
    // newsletter script, on the index page
    'script[src*="newsletter"]',
    // login box script, on the index page
    'script[src*="auth-modal."]',
    // remove styles on the index page
    'link[rel="stylesheet"][href*="auth-modal."]',
    'link[rel="stylesheet"][href*="home_newsletter."]',
    'link[rel="stylesheet"][href*="subscriptions."]',
    'link[rel="stylesheet"][href*="home_featured."]',
    'link[rel="stylesheet"][href*="mdn-subscriptions."]',
    'link[rel="stylesheet"][href*="banners."]',
    // join community
    '.communitybox',
    // active-banner.jsx
    '.developer-needs.mdn-cta-container',
    // popup at bottom
    '#contribution-popover-container',
    // translation
    '.translationInProgress',
    // translation
    '#doc-pending-fallback',
    // remove google cdn stuff
    'link[href*="googleapis.com"]',
    'script[src*="googleapis.com"]',
    // This page was translated from English by the community.
    // Learn more and join the MDN Web Docs community.
    '.localized-content-note',
    // Change your language (bottom)
    '.language-menu',
    // Change language | View in English
    '.language-toggle',
    // 20220717 Latest news from hacks.mozilla.org on index page
    '.latest-news',
    // 20220717 Already a subscriber? Get MDN Plus
    '.auth-container',
  ].join(',')).remove();
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
  // 20251005 banner
  $('.page-layout__banner').remove();
  $('.translation-banner').remove();
  // language switcher
  $('mdn-language-switcher').remove();
  // GitHub issue widgets require Fred hydration and the live GitHub API.
  // Keep the intent as a static external link for offline builds.
  $('mdn-issues-table').each((i, el) => {
    $(el).replaceWith(
      '<p><a class="external" target="_blank" rel="noopener noreferrer" ' +
      'href="https://github.com/search?q=org%3Amdn+is%3Aissue+is%3Aopen+' +
      'label%3A%22good+first+issue%22%2C%22accepting+PR%22&type=issues">' +
      'View beginner-friendly MDN issues on GitHub</a></p>'
    );
  });
  // footer
  $('.article-footer__links,mdn-content-feedback').remove();
  $('.article-footer__inner>#feedback').remove();
  $('.article-footer__svg-container,.article-footer__contribute').remove();
  $('.page-layout__footer').remove();
  // search box
  $('.homepage-header__search').addClass('hide');
  $('.navigation__search').addClass('hide');
  // homepage
  $('.homepage-body>section:not(:first-child)').remove();
  // footer
  $('.homepage-footer').remove();
  // menus
  $('.menu__tab[data-section="tools"] .menu__panel-content>ul:first-child').remove();
};
