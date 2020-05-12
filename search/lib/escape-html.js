const entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  '\'': '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

/**
 * @param {string} string
 * @return {string}
 */
const escapeHtml = string =>
  String(string).replace(/[&<>"'`=\\/]/g, s => entityMap[s]);

module.exports = escapeHtml;