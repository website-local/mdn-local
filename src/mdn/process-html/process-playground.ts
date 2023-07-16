import type {Cheerio, CheerioStatic} from 'website-scrap-engine/lib/types';
import URI from 'urijs';

const PLAYGROUND_ID_ATTR = 'data-playground-id';
const PLAYGROUND_LOCAL_ATTR = 'data-mdn-local-pg-id';

export function preProcessPlayground($: CheerioStatic): void {
  const frames = $('iframe');
  for (let i = 0; i < frames.length; i++) {
    const frame = $(frames[i]);
    const src = frame.attr('src');
    if (!src) {
      continue;
    }
    const uri = URI(src);
    if (!uri.pathname()?.endsWith('/runner.html')) {
      continue;
    }
    const searchMap = uri.search(true);
    const id =searchMap?.id;
    if (!id) {
      continue;
    }
    frame.attr(PLAYGROUND_ID_ATTR, id);
  }
}

export function postProcessPlayground($: CheerioStatic): void {
  const frames = $('iframe');
  let iframeId = 0;
  for (let i = 0; i < frames.length; i++) {
    const frame = $(frames[i]);
    const id = frame.attr(PLAYGROUND_ID_ATTR);
    if (!id) {
      continue;
    }
    const src = frame.attr('src');
    if (!src) {
      continue;
    }
    const uri = URI(src);
    uri.addSearch('id', id);
    frame.attr('src', uri.toString());
    const ctx =
      getCodeAndNodesForIframeBySampleClass($, id, src) ||
      getCodeAndNodesForIframe($, id, frame, src);
    if (ctx?.nodes?.length) {
      ++iframeId;
      const localId = String(iframeId);
      frame.attr(PLAYGROUND_LOCAL_ATTR, localId);
      for (const node of ctx.nodes) {
        node.attr(PLAYGROUND_LOCAL_ATTR, localId);
      }
    }
  }
}

interface EditorContent {
  css: string;
  html: string;
  js: string;
  src?: string;
}

// https://github.com/mdn/yari/blob/v2.28.1/client/src/document/code/playground.ts

const LIVE_SAMPLE_PARTS = ['html', 'css', 'js'];

const SECTION_RE = /h[1-6]/i;

function partOfSection(heading: Cheerio, element: Cheerio) {
  if (
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    SECTION_RE.test(element.prop('tagName')!) &&
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    element.prop('tagName')!.toLowerCase() <= (heading.prop('tagName')?.toLowerCase() || '')
  ) {
    return false;
  }
  return true;
}

function sectionForHeading($: CheerioStatic, heading: Cheerio | null): Cheerio[] {
  if (heading === null) {
    return [];
  }
  const nodes: Cheerio[] = [];
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  if (!SECTION_RE.test(heading.prop('tagName')!)) {
    return [...heading.children().map((_, el) => $(el))];
  }
  let next = heading.next();
  while (next && partOfSection(heading, next)) {
    nodes.push(next);
    if (next.next().length === 0) {
      next = next.parent().next().children().first() || null;
    } else {
      next = next.next();
    }
  }
  return nodes;
}

function closestHeading(element: Cheerio) {
  let prev = element;
  while (prev.parent().children().first().length) {
    if (SECTION_RE.test(prev.parent().children().first().prop('tagName'))) {
      return prev.parent().children().first();
    }
    prev = prev.parent();
  }
  return null;
}

function prevHeading(heading: Cheerio) {
  let prev = heading;
  while (prev.parent().prev().children().first().length) {
    prev = prev.parent().prev().children().first();
    if (
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      SECTION_RE.test(prev.prop('tagName')!) &&
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      prev.prop('tagName')!.toLowerCase() < (heading.prop('tagName')?.toLowerCase() || '')
    ) {
      return prev;
    }
  }
  return null;
}

function codeForHeading(
  $: CheerioStatic,
  heading: Cheerio | null,
  src: string
): { code: EditorContent; nodes: Cheerio[] } | null {
  const section = sectionForHeading($, heading);

  if (!section.length) {
    return null;
  }
  const code: EditorContent = {
    css: '',
    html: '',
    js: '',
    src,
  };

  const nodes: Cheerio[] = [];
  for (const part of LIVE_SAMPLE_PARTS) {
    section
      .flatMap((e) => [...e.find(`pre.${part}`)])
      .forEach((e) => {
        nodes.push($(e));
        // return e.textContent;
      });
    // if (src) {
    //   code[part] += src;
    // }
  }
  return nodes.length ? { code, nodes } : null;
}

function getLanguage(node: Cheerio): string | null {
  for (const part of LIVE_SAMPLE_PARTS) {
    if (node.hasClass(part)) {
      return part;
    }
  }
  return null;
}

export function getCodeAndNodesForIframeBySampleClass(
  $: CheerioStatic,
  cls: string,
  src: string
) {
  const code: EditorContent = {
    css: '',
    html: '',
    js: '',
    src,
  };

  let empty = true;
  const nodes: Cheerio[] = [];
  [...$(`.live-sample___${cls}`)].forEach(
    (el) => {
      const pre = $(el);
      const lang = getLanguage(pre);
      if (lang === null) {
        return;
      }
      empty = false;
      nodes.push(pre);
      // code[lang] += pre.textContent;
    }
  );
  return empty ? null : { code, nodes };
}

export function getCodeAndNodesForIframe(
  $: CheerioStatic,
  id: string,
  iframe: Cheerio,
  src: string
) {
  let heading = $('#' + id) || closestHeading(iframe);
  if (!heading) {
    return null;
  }
  let r = codeForHeading($, heading, src);
  while (r === null) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    heading = prevHeading(heading)!;
    if (heading === null) {
      return null;
    }
    r = codeForHeading($, heading, src);
  }
  return r;
}
