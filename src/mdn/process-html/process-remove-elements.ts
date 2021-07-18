import type {CheerioStatic} from 'website-scrap-engine/lib/types';

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
};
