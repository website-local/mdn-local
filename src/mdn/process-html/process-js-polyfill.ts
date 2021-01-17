import type {Cheerio, CheerioStatic} from 'website-scrap-engine/lib/types';

const JS_POLYFILL_CLASS = 'js-polyfill-temp-script';
const SCRIPT_PREFIX = '<script src="';

export const preProcessJsPolyFill = ($: CheerioStatic, text: string): void => {
  let beginIndex = text.indexOf(SCRIPT_PREFIX);
  if (beginIndex < 1) return;
  beginIndex += SCRIPT_PREFIX.length;
  const endIndex = text.indexOf('"', beginIndex);
  if (endIndex < 1) return;
  const src = text.slice(beginIndex, endIndex);
  $('head').append(`<script class="${JS_POLYFILL_CLASS}" src="${src}">`);
};

export const postProcessJsPolyFill = (
  $: CheerioStatic,
  elem: Cheerio,
  text: string
): void | Cheerio => {
  let beginIndex = text.indexOf(SCRIPT_PREFIX);
  if (beginIndex < 1) return elem.remove();
  beginIndex += SCRIPT_PREFIX.length;
  const endIndex = text.indexOf('"', beginIndex);
  if (endIndex < 1) return elem.remove();
  const tempScript = $('.' + JS_POLYFILL_CLASS);
  if (!tempScript || !tempScript.length) return elem.remove();
  const src = tempScript.attr('src');
  tempScript.remove();
  elem.html((text.slice(0, beginIndex) + src + text.slice(endIndex))
    // escape tag for cheerio
    .replace('<script', '\\x3cscript')
    .replace('<\\/script>', '\\x3c/script\\x3e'));
};
