import type {CheerioStatic} from 'website-scrap-engine/lib/types.js';

const SELECTOR_HTML = '.code-example > .html.interactive-example > code,' +
  ' .code-example > .html.interactive-example-choice > code,' +
  ' .code-example > .html-hidden.interactive-example > code' +
  ' .code-example > .html-hidden.interactive-example-choice > code';

const SELECTOR_CSS = '.code-example > .css.interactive-example > code,' +
  ' .code-example > .css.interactive-example-choice > code,' +
  ' .code-example > .css-hidden.interactive-example > code' +
  ' .code-example > .css-hidden.interactive-example-choice > code';

export function preProcessInteractiveExample(
  $: CheerioStatic,
): void {
  $(SELECTOR_HTML).each((i, el) => {
    const e = $(el);
    e.html(e.text());
  });
  $(SELECTOR_CSS).each((i, el) => {
    const e = $(el);
    e.html(`<style>${e.text()}</style>`);
  });
}

export function postProcessInteractiveExample(
  $: CheerioStatic,
): void {
  $(SELECTOR_HTML).each((_, el) => {
    const e = $(el);
    e.text(e.html() || '');
  });
  $(SELECTOR_CSS).each((_, el) => {
    const e = $(el);
    e.text(e.find('style').html() || '');
  });
}
