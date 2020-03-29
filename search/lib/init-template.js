const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const initTemplate = async (config) => {
  const templatePath = config.templatePage ?
    path.join(config.rootDir, config.templatePage) :
    path.join(config.rootDir, config.locale, 'index.html');
  const template = await fs.promises.readFile(templatePath, {
    encoding: 'utf8'
  });
  const injectCssPath = config.injectCssFile ?
    path.join(config.rootDir, config.injectCssFile) :
    path.join(config.rootDir, 'static', 'build', 'styles', 'inject.css');

  const injectCss = (await fs.promises.readFile(injectCssPath, {
    encoding: 'utf8'
  })).replace('#nav-main-search,', '');

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
  const searchCssPath = path.resolve(__dirname, 'search.min.css');
  const searchStyle = await fs.promises.readFile(searchCssPath, {
    encoding: 'utf8'
  });
  return {styleSheetUrls, icon, header, searchStyle, injectCss};
};

module.exports = initTemplate;
