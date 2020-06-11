const URI = require('urijs');
const Downloader = require('../lib/downloader');
const configureLogger = require('../lib/logger-config');

const preProcessHtml = ($) => {
  // remove all scripts
  $('script').remove();
  $('#search-form,#search-query-nav,#search-query-sidebar,#search-query-menu').remove();
  $('link[rel="alternate"]').remove();
  $('link[rel="preconnect"]').remove();
  $('link[rel="prefetch"]').remove();
  $('link[rel="preload"]').remove();
  $('link[rel="apple-touch-icon"]').remove();
  $('link[href*="webpack.github.io"]').remove();
  $('link[href*="fonts.googleapis.com"]').remove();
  $('iframe').remove();
  $('img[src*="github.com"]').remove();
  $('.ad-pagetop,.carbon-ads').remove();
  $('.vueschool,.vue-mastery,.scrimba').remove();
  return $;
};


module.exports = (localRoot, host, options = {}) => {
  configureLogger(localRoot, host);
  if (!options.req) {
    options.req = {};
  }

  let d = new Downloader(Object.assign({
    beginUrl: `https://${host}/`,
    depth: 4,
    localRoot,
    skipProcessFunc: url => {
      if (url.startsWith('/')) {
        return false;
      }
      if (url.startsWith('#') ||
        url.startsWith('data:') ||
        url.startsWith('javascript:') ||
        url.startsWith('about:') ||
        url.startsWith('chrome:')) {
        return true;
      }
      let uri = URI(url);
      return uri.host() && uri.host() !== host;
    },
    preProcessHtml
  }, options));

  d.start();
  return d;
};
