export function defaultInitialUrl(locale: string): string[] {
  const strings = [
    `https://developer.mozilla.org/${locale}/docs/Web/API`,
    `https://developer.mozilla.org/${locale}/docs/Web/CSS/Reference`,
    `https://developer.mozilla.org/${locale}/docs/Web/JavaScript`,
    `https://developer.mozilla.org/${locale}/docs/Web/HTML/Index`,
    `https://developer.mozilla.org/${locale}/docs/Web/HTML/Attributes`,
    `https://developer.mozilla.org/${locale}/docs/Web/HTML/Element`,
    `https://developer.mozilla.org/${locale}/docs/Web/HTTP`,
    `https://developer.mozilla.org/${locale}/docs/Web/Tutorials`,
    `https://developer.mozilla.org/${locale}/docs/Web/Guide`,
    `https://developer.mozilla.org/${locale}/docs/Web/Accessibility`,
    `https://developer.mozilla.org/${locale}/docs/Web/Reference`,
    `https://developer.mozilla.org/${locale}/docs/Web/Web_components`,
    `https://developer.mozilla.org/${locale}/docs/Web/MathML`,
    `https://developer.mozilla.org/${locale}/docs/Web`,
    `https://developer.mozilla.org/${locale}/docs/Mozilla`,
    `https://developer.mozilla.org/${locale}/docs/Mozilla/Add-ons/WebExtensions`,
    `https://developer.mozilla.org/${locale}/docs/Learn`,
    `https://developer.mozilla.org/${locale}/docs/Games`,
    `https://developer.mozilla.org/${locale}/docs/Glossary`,
    // https://github.com/website-local/mdn-local/issues/214
    // 20230716 incorrect encoding without toLowerCase
    `https://developer.mozilla.org/sitemaps/${locale.toLowerCase()}/sitemap.xml.gz`,
    // https://github.com/website-local/mdn-local/issues/372
    `https://developer.mozilla.org/${locale}/search-index.json`,
  ];
  if (locale !== 'en-US') {
    // 20230716 incorrect encoding without toLowerCase
    strings.push('https://developer.mozilla.org/sitemaps/en-us/sitemap.xml.gz');
  }
  return strings;
}
