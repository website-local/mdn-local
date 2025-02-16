import type {
  DownloadResource
} from 'website-scrap-engine/lib/life-cycle/types.js';
import type {Resource} from 'website-scrap-engine/lib/resource.js';
import {ResourceType} from 'website-scrap-engine/lib/resource.js';
import type {Cheerio, CheerioStatic} from 'website-scrap-engine/lib/types.js';

interface InteractiveExampleResource extends Resource {
  type: ResourceType.Html,
  meta: DownloadResource['meta'] & {
    doc: CheerioStatic
  }
}

const BASE_URL = 'https://interactive-examples.mdn.mozilla.net/pages/';
const HTML_EXAMPLE_URL = BASE_URL + 'tabbed/';
const CSS_EXAMPLE_URL = BASE_URL + 'css/';
const WRAP_CLASS_NAME ='mdn-local-unwrap-to-inner-text';
const WRAP_SELECTOR = '.' + WRAP_CLASS_NAME;
// language=JQuery-CSS
const HTML_SELECTOR = '#html-panel > #html-editor > pre > code';
// language=JQuery-CSS
const HTML_CSS_SELECTOR = '#css-panel > #css-editor > pre > code';
// language=JQuery-CSS
const CSS_SELECTOR = '#example-choice-list > .example-choice > pre > .language-css';

const isResourceInteractiveExample = (
  res: Resource
): res is InteractiveExampleResource => {
  if (res.type !== ResourceType.Html) {
    return false;
  }
  return res.downloadLink.startsWith(BASE_URL);
};

const wrapTextToHtml = (elements: Cheerio, tag: string): void => {
  if (!elements?.length) {
    return;
  }
  for (let i = 0, l = elements.length, el, text; i < l; i++) {
    el = elements.eq(i);
    text = el.text();
    if (!text || !text.trim()) {
      continue;
    }
    // language=HTML
    el.html(`<${tag} class="${WRAP_CLASS_NAME}">${text}</${tag}>`);
  }
};

export function preProcessInteractiveExample(
  $: CheerioStatic,
  res: Resource
): CheerioStatic {
  if (!isResourceInteractiveExample(res)) {
    return $;
  }
  if (res.downloadLink.startsWith(HTML_EXAMPLE_URL)) {
    wrapTextToHtml($(HTML_SELECTOR), 'div');
    wrapTextToHtml($(HTML_CSS_SELECTOR), 'style');
  } else if (res.downloadLink.startsWith(CSS_EXAMPLE_URL)) {
    wrapTextToHtml($(CSS_SELECTOR), 'style');
  }
  return $;
}

export function postProcessInteractiveExample(
  $: CheerioStatic,
  res: Resource
): CheerioStatic {
  if (!isResourceInteractiveExample(res)) {
    return $;
  }
  const elements: Cheerio = $(WRAP_SELECTOR);
  if (!elements?.length) {
    return $;
  }
  for (let i = 0, l = elements.length, el, text; i < l; i++) {
    el = elements.eq(i);
    text = el.html();
    if (!text || !text.trim()) {
      continue;
    }
    el.text(text);
    // el.unwrap()
    // https://github.com/cheeriojs/cheerio/issues/541
    el.after(el.contents()).remove();
  }
  return $;
}
