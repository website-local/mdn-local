import type {Cheerio, CheerioStatic} from 'website-scrap-engine/lib/types';
import type {
  DownloadResource,
  SubmitResourceFunc
} from 'website-scrap-engine/lib/life-cycle/types';
import type {
  PipelineExecutor
} from 'website-scrap-engine/lib/life-cycle/pipeline-executor';
import type {StaticDownloadOptions} from 'website-scrap-engine/lib/options';
import {ResourceType} from 'website-scrap-engine/lib/resource';
import {simpleHashString} from 'website-scrap-engine/lib/util';

const PLAYGROUND_LOCAL_ATTR = 'data-mdn-local-pg-id';

export async function preProcessPlayground(
  res: DownloadResource,
  submit: SubmitResourceFunc,
  options: StaticDownloadOptions,
  pipeline: PipelineExecutor,
  $: CheerioStatic
): Promise<void> {
  const frames = $('iframe');
  let iframeId = 0;
  for (let i = 0; i < frames.length; i++) {
    const frame = $(frames[i]);
    const id = frame.attr('data-live-id');
    if (!id) {
      continue;
    }
    const path = frame.attr('data-live-path') || '/';

    const r =
      getCodeAndNodesForIframeBySampleClass($, id, path) ||
      getCodeAndNodesForIframe($, id, frame, path);
    if (r === null) {
      continue;
    }
    if (r?.nodes?.length) {
      ++iframeId;
      const localId = String(iframeId);
      frame.attr(PLAYGROUND_LOCAL_ATTR, localId);
      for (const node of r.nodes) {
        node.attr(PLAYGROUND_LOCAL_ATTR, localId);
      }
    }
    // https://github.com/website-local/mdn-local/issues/974
    // a fake path here
    const hash = simpleHashString(JSON.stringify(r.code));
    const iframeUrl = path.endsWith('/') ?
      path + 'runner-' + hash + '.html' :
      path + '/runner-' + hash + '.html';
    const iframeRes = await pipeline.createAndProcessResource(
      iframeUrl, ResourceType.Html, res.depth, frame, res);
    if (!iframeRes) {
      continue;
    }
    const iframeHtml = renderHtml(r.code);
    iframeRes.body = iframeHtml;
    iframeRes.meta = {
      doc: $.load(iframeHtml)
    };
    const processed =
      await pipeline.processAfterDownload(iframeRes as DownloadResource, submit, options);
    if (!processed) {
      continue;
    }
    frame.removeAttr('srcdoc');
    frame.attr('src', processed.replacePath);
    // this resource has to be submitted, since runner path could diff from src page
    submit(processed);
  }
}

interface EditorContent {
  css: string;
  html: string;
  js: string;
  src?: string;
}

// https://github.com/mdn/yari/blob/v2.28.1/client/src/document/code/playground.ts

const LIVE_SAMPLE_PARTS: (keyof EditorContent)[] = ['html', 'css', 'js'];

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
  while (next.length && partOfSection(heading, next)) {
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
    // error TS2345
    const tagName = prev.parent().children().first().prop('tagName');
    if (tagName && SECTION_RE.test(tagName)) {
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
    const src = section
      .flatMap((e) => [...e.find(`pre.${part}`)])
      .map((e) => {
        nodes.push($(e));
        return $(e).text();
      }).join('\n');
    if (src) {
      code[part] += src;
    }
  }
  return nodes.length ? { code, nodes } : null;
}

function getLanguage(node: Cheerio): keyof EditorContent | null {
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
      code[lang] += pre.text();
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

/**
 * https://github.com/mdn/yari/blob/v4.3.0/libs/play/index.js#L189
 * @param {EditorContent | null} state
 */
function renderHtml(state: EditorContent | null = null) {
  const { css, html, js } = state || {
    css: '',
    html: '',
    js: '',
  };
  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      /* Legacy css to support existing live samples */
      body {
        padding: 0;
        margin: 0;
      }

      svg:not(:root) {
        display: block;
      }

      .playable-code {
        background-color: #f4f7f8;
        border: none;
        border-left: 6px solid #558abb;
        border-width: medium medium medium 6px;
        color: #4d4e53;
        height: 100px;
        width: 90%;
        padding: 10px 10px 0;
      }

      .playable-canvas {
        border: 1px solid #4d4e53;
        border-radius: 2px;
      }

      .playable-buttons {
        text-align: right;
        width: 90%;
        padding: 5px 10px 5px 26px;
      }
    </style>
    <style>
      ${css}
    </style>

    <script>
      const consoleProxy = new Proxy(console, {
        get(target, prop) {
          if (typeof target[prop] === "function") {
            return (...args) => {
              try {
                window.parent.postMessage({ typ: "console", prop, args }, "*");
              } catch {
                try {
                  window.parent.postMessage(
                    {
                      typ: "console",
                      prop,
                      args: args.map((x) => JSON.parse(JSON.stringify(x))),
                    },
                    "*"
                  );
                } catch {
                  try {
                    window.parent.postMessage(
                      {
                        typ: "console",
                        prop,
                        args: args.map((x) => x.toString()),
                      },
                      "*"
                    );
                  } catch {
                    window.parent.postMessage(
                      {
                        typ: "console",
                        prop: "warn",
                        args: [
                          "[Playground] Unsupported console message (see browser console)",
                        ],
                      },
                      "*"
                    );
                  }
                }
              }
              target[prop](...args);
            };
          }
          return target[prop];
        },
      });

      window.console = consoleProxy;
      window.addEventListener("error", (e) => console.log(e.error));
    </script>
  </head>
  <body>
    ${html}
    <script>${js}</script>
  </body>
</html>
`;
}
