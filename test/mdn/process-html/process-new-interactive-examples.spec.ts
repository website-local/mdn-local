import {describe, expect, test} from '@jest/globals';
import {load} from 'cheerio';
import {
  postProcessInteractiveExample,
  preProcessInteractiveExample,
} from '../../../src/mdn/process-html/process-new-interactive-examples.js';

describe('process-new-interactive-examples', () => {
  test('only rewrites actual interactive examples', () => {
    const $ = load(`
      <div class="code-example">
        <pre class="brush: html notranslate"><code>&lt;img src="/message"&gt;</code></pre>
      </div>
      <div class="code-example">
        <pre class="brush: css notranslate"><code>body { color: red; }</code></pre>
      </div>
      <div class="code-example">
        <pre class="brush: html interactive-example notranslate"><code>&lt;section id="default-example"&gt;&lt;/section&gt;</code></pre>
      </div>
      <div class="code-example">
        <pre class="brush: css interactive-example notranslate"><code>#default-example { color: blue; }</code></pre>
      </div>
    `);

    preProcessInteractiveExample($);

    const genericHtml = $('.code-example pre').eq(0).find('code');
    const genericCss = $('.code-example pre').eq(1).find('code');
    const interactiveHtml = $('.code-example pre').eq(2).find('code');
    const interactiveCss = $('.code-example pre').eq(3).find('code');

    expect(genericHtml.html()).toContain('&lt;img src="/message"&gt;');
    expect(genericCss.html()).toBe('body { color: red; }');
    expect(interactiveHtml.html()).toBe('<section id="default-example"></section>');
    expect(interactiveCss.html()).toBe('<style>#default-example { color: blue; }</style>');

    postProcessInteractiveExample($);

    expect(genericHtml.text()).toBe('<img src="/message">');
    expect(genericCss.text()).toBe('body { color: red; }');
    expect(interactiveHtml.text()).toBe('<section id="default-example"></section>');
    expect(interactiveCss.text()).toBe('#default-example { color: blue; }');
  });
});
