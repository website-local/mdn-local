const escapeHtml = require('./escape-html');
const fs = require('fs');
const path = require('path');
const searchStyle = fs.readFileSync(path.join(__dirname, 'search.min.css'), {
  encoding: 'utf8'
});

const renderSearch = (config, stream, title, page, from, body) => {
  let hits;
  if (!body || !(hits = body.hits)) return;
  let count;
  if (!(count = hits.total)) return;
  let endCount = from + hits.hits.length;
  if (from >= endCount) {
    from = endCount - 1;
  }
  stream.push(`<div class="search-results">
<div class="result-container">
<p class="result-meta">${config.text.meta[0] || ''}${config.locale}${
  config.text.meta[1] || ''
}${count.value}${config.text.meta[2]}${title}${
  config.text.meta[3] || ''
}${from + 1}${config.text.meta[4] || ''}${endCount}${
  config.text.meta[5] || ''
}</p></div>`);
  for (let i = 0, item; i < hits.hits.length; i++) {
    item = hits.hits[i];
    stream.push(`<div class="result-container"><div class="result">\
<div><a class="result-title" href="../${item._id}">${item._source.title}</a></div>\
<div class="result-excerpt">${
  item.highlight && item.highlight.content.join('<br/>') || ''
}</div>\
<div class="result-url"><a href="../${item._id}">${item._id}</a></div></div></div>`);
  }
  stream.push('<div class="result-container results-more"><div>');
  if (page > 1) {
    stream.push(`<a class="button" href="?page=${page - 1}&amp;q=${
      title
    }" id="search-result-previous">${config.text.previousPage}</a>`);
  }
  if (count.value > endCount) {
    stream.push(` <a class="button" href="?page=${page + 1}&amp;q=${
      title
    }" id="search-result-next">${config.text.nextPage}</a>`);
  }
  stream.push('</div></div></div>');
};

const renderPage = (config, templateData, stream, title, page, from, content) => {
  // noinspection HtmlRequiredTitleElement
  stream.push(`<!DOCTYPE html><html lang="${config.locale}" dir="ltr" class="no-js">\
<head prefix="og: http://ogp.me/ns#">\
<meta charset="utf-8">\
<meta http-equiv="X-UA-Compatible" content="IE=Edge">\
<title>${config.text.beforeTitle || ''}${
  title = escapeHtml(title)
}${config.text.afterTitle || ''}</title>\
<meta name="viewport" content="width=device-width, initial-scale=1">\
<meta name="robots" content="noindex, nofollow">`);
  for (let i = 0, a = templateData.styleSheetUrls, l = a.length; i < l; i++) {
    // we trust templateData, no escape here
    stream.push(`<link href="${a[i]}" rel="stylesheet" type="text/css">`);
  }
  if (templateData.icon) {
    stream.push(`<link href="${templateData.icon}" rel="shortcut icon">`);
  }
  stream.push('<style>');
  stream.push(searchStyle);
  stream.push('</style></head><body>');
  if (templateData.header) {
    stream.push('<div id="react-container"><header class="page-header">');
    stream.push(templateData.header);
    // noinspection HtmlUnknownAttribute
    stream.push(`<form class="header-search" id="nav-main-search" \
action="" method="get" role="search">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 28" \
aria-hidden="true" class="search-icon">
<path d="M18 13c0-3.859-3.141-7-7-7s-7 3.141-7 7 3.141 7 7 7 7-3.141 \
7-7zm8 13c0 1.094-.906 2-2 2a1.96 1.96 0 0 1-1.406-.594l-5.359-5.344a10.971 \
10.971 0 0 1-6.234 1.937c-6.078 0-11-4.922-11-11s4.922-11 11-11 11 4.922 \
11 11c0 2.219-.672 4.406-1.937 6.234l5.359 5.359c.359.359.578.875.578 1.406z">\
</path></svg>`);
    stream.push(`<label for="main-q" class="visually-hidden">${config.text.search}</label>\
<input class="search-input-field" type="search" \
id="main-q" name="q" value="${title}" placeholder="${config.text.search}" \
minlength="2" pattern="(.|\\s)*\\S(.|\\s)*" required>\
<input style="display: none" id="main-search-submit" type="submit">\
</form></header></div>`);
  }
  stream.push(`<div class="titlebar-container"><div class="titlebar">\
<h1 class="title">${config.text.results}${title}</h1></div></div>`);
  if (content.statusCode === 200) {
    renderSearch(config, stream, title, page, from, content.body);
  }
  stream.push('</body></html>');
};

module.exports = renderPage;