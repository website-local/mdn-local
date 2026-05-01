import {describe, expect, test} from '@jest/globals';
import {load} from 'cheerio';
import {
  preProcessRemoveElements,
} from '../../../src/mdn/process-html/process-remove-elements.js';

describe('process-remove-elements', () => {
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
