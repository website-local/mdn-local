const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const initTemplate = async (config) => {
  const templatePath = config.templatePage ?
    path.join(config.rootDir, config.templatePage) :
    path.join(config.rootDir, config.locale, 'index.html');

  const injectCssPath = config.injectCssFile ?
    path.join(config.rootDir, config.injectCssFile) :
    path.join(config.rootDir, 'static', 'build', 'styles', 'inject.css');
  const searchCssPath = path.resolve(__dirname, 'search.min.css');
  const searchScriptPath = path.resolve(__dirname, 'search.js');
  // noinspection JSCheckFunctionSignatures
  const promises = [injectCssPath, searchCssPath, searchScriptPath, templatePath]
    .map(p => fs.promises.readFile(p, {encoding: 'utf8'}));

  const template = await promises[3];
  const $ = cheerio.load(template);
  const styleSheets = $('link[rel="stylesheet"]');
  const styleSheetUrls = [];
  styleSheets.each((i, e) => {
    let url = $(e).attr('href');
    if (url.includes('react-header') || url.includes('react-mdn') || url.includes('print')) {
      styleSheetUrls.push(url);
    }
  });
  const icon = $('link[rel="shortcut icon"]').attr('href');
  const header = $('.page-header').html();

  const [injectCss, searchStyle, searchScript] = await Promise.all(promises);
  return {styleSheetUrls, icon, header, searchStyle, injectCss, searchScript};
};

module.exports = initTemplate;
