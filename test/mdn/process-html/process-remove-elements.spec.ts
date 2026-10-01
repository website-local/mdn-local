import {describe, expect, test} from '@jest/globals';
import {load} from 'cheerio';
import {
  preProcessRemoveElements,
} from '../../../src/mdn/process-html/process-remove-elements.js';

describe('process-remove-elements', () => {
  test('removes overlapping cleanup matches while preserving content and later rules', () => {
    const $ = load(`
      <head>
        <meta name="twitter:card" content="summary">
        <meta name="description" content="Keep this">
        <link rel="canonical" href="https://developer.mozilla.org/">
        <link rel="stylesheet" href="/article.css">
      </head>
      <body>
        <div class="global-notice"><div class="newsletter-box">Remove nested</div></div>
        <div class="home-content-container"><div class="blog-feed">Remove blog</div></div>
        <article><div class="blog-feed">Keep article</div></article>
        <script src="https://transcend-cdn.com/example.js"></script>
        <script src="/article.js"></script>
        <nav><div><a id="mdn-plus-button">Plus</a></div><a href="/docs">Docs</a></nav>
        <aside class="sidebar-filter-container">Filter</aside>
        <div class="homepage-body"><section>First</section><section>Second</section></div>
      </body>
    `);

    preProcessRemoveElements($);

    expect($('.global-notice,.newsletter-box,.home-content-container>.blog-feed'))
      .toHaveLength(0);
    expect($('article').text()).toBe('Keep article');
    expect($('meta').attr('name')).toBe('description');
    expect($('link').attr('href')).toBe('/article.css');
    expect($('script')).toHaveLength(1);
    expect($('script').attr('src')).toBe('/article.js');
    expect($('nav').text()).toBe('Docs');
    expect($('.sidebar-filter-container').hasClass('hide')).toBe(true);
    expect($('.homepage-body>section')).toHaveLength(1);
    expect($('.homepage-body').text()).toBe('First');
  });

  test('replaces online-only issue widgets with a static external link', () => {
    const $ = load(`
      <section>
        <p>Help improve MDN.</p>
        <mdn-issues-table class="issues-table">
          <template shadowroot="open">loading issues...</template>
          <table><tbody></tbody></table>
        </mdn-issues-table>
      </section>
    `);

    preProcessRemoveElements($);

    expect($('mdn-issues-table')).toHaveLength(0);
    const link = $('a').first();
    expect(link.text()).toBe('View beginner-friendly MDN issues on GitHub');
    expect(link.attr('href')).toContain('https://github.com/search?');
    expect(link.attr('class')).toBe('external');
    expect(link.attr('target')).toBe('_blank');
    expect(link.attr('rel')).toBe('noopener noreferrer');
  });
});
