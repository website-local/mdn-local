import type {CheerioStatic} from 'website-scrap-engine/lib/types';
import {ResourceType} from 'website-scrap-engine/lib/resource';

function trimMatch(text1: string, text2: string): boolean {
  text1 = text1.split('\n').map(line => line.trim()).filter(Boolean).join('\n');
  text2 = text2.split('\n').map(line => line.trim()).filter(Boolean).join('\n');
  return text1.toLowerCase().trim() === text2.toLowerCase().trim();
}

const PLAYABLE_HTML_MARK =
  'mdn-local-playable-html-mark';
const PLAYABLE_CSS_MARK =
  'mdn-local-playable-css-mark';

export function preProcessPlayable($: CheerioStatic): void {
  const section = $('section.preview');
  const editable = $('style.editable');
  const textareaHTML = $('.playable-html');
  const textareaCSS = $('.playable-css');
  if (section.length === 1 && textareaHTML.length === 1 &&
    trimMatch(section.html() || '',
      $.load(textareaHTML.text(), null, false).html())) {
    section.attr(PLAYABLE_HTML_MARK, 'html');
    textareaHTML.attr(PLAYABLE_HTML_MARK, 'textarea');
  }
  if (editable.length === 1 && textareaCSS.length === 1 &&
    trimMatch(editable.html() || '', textareaCSS.text())) {
    editable.attr(PLAYABLE_CSS_MARK, 'css');
    textareaCSS.attr(PLAYABLE_CSS_MARK, 'textarea');
  }
}

export function postProcessPlayable($: CheerioStatic): void {
  const section =
    $(`section.preview[${PLAYABLE_HTML_MARK}=html]`);
  const editable =
    $(`style.editable[${PLAYABLE_CSS_MARK}=css]`);
  const textareaHTML =
    $(`.playable-html[${PLAYABLE_HTML_MARK}=textarea]`);
  const textareaCSS =
    $(`.playable-css[${PLAYABLE_CSS_MARK}=textarea]`);
  if (section.length === 1 && textareaHTML.length === 1) {
    section.removeAttr(PLAYABLE_HTML_MARK);
    textareaHTML.removeAttr(PLAYABLE_HTML_MARK);
    textareaHTML.text(section.html() || '');
  }
  if (editable.length === 1 && textareaCSS.length === 1) {
    editable.removeAttr(PLAYABLE_CSS_MARK);
    textareaCSS.removeAttr(PLAYABLE_CSS_MARK);
    textareaCSS.text(editable.html() || '');
  }
}
