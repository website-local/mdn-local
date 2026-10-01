import {Script} from 'node:vm';
import type {CheerioStatic} from 'website-scrap-engine/lib/types.js';
import type {
  DownloadResource, SubmitResourceFunc
} from 'website-scrap-engine/lib/life-cycle/types.js';
import type {
  PipelineExecutor
} from 'website-scrap-engine/lib/life-cycle/pipeline-executor.js';
import {ResourceType} from 'website-scrap-engine/lib/resource.js';
import {toString} from 'website-scrap-engine/lib/util.js';
import {externalHosts} from '../process-url/consts.js';

export function externalDemoUrl(res: DownloadResource): string | undefined {
  const url = new URL(res.redirectedUrl || res.url);
  for (const external of externalHosts) {
    if (url.hostname === external.host) return url.href;
    if (url.hostname === 'developer.mozilla.org' &&
      url.pathname.startsWith(external.prefix)) {
      url.hostname = external.host;
      url.protocol = external.protocol + ':';
      url.pathname = url.pathname.slice(external.pathPrefixLength);
      return url.href;
    }
  }
}

// Compile only; downloaded code must never execute in the downloader. Reject
// module-only features and scope-sensitive constructs conservatively (even in
// comments/strings) rather than attempting to bundle a module graph.
export function classicDemoModule(source: string): string | undefined {
  if (/\b(?:import|export|arguments|eval|currentScript)\b|\\u/.test(source)) {
    return;
  }
  try {
    new Script(`'use strict';\n${source}`);
    const wrapped = `(function () {\n'use strict';\n${source}\n})();`;
    new Script(wrapped);
    return wrapped;
  } catch {
    return;
  }
}

export async function preProcessDemoModules(
  $: CheerioStatic,
  res: DownloadResource,
  submit: SubmitResourceFunc,
  pipeline: PipelineExecutor,
  liveUrl: string
): Promise<void> {
  const scripts = $('script[type="module"]');
  const seen = new Set<string>();
  let needsLiveExample = false;
  for (const node of scripts.toArray()) {
    const script = $(node);
    let source = script.html() || '';
    const src = script.attr('src');
    try {
      if (src !== undefined) {
        const resource = await pipeline.createAndProcessResource(
          src, ResourceType.Binary, res.depth + 1, script, res);
        if (!resource || resource.shouldBeDiscardedFromDownload) {
          throw new Error('Module source unavailable');
        }
        if (seen.has(resource.url)) {
          script.remove();
          continue;
        }
        seen.add(resource.url);
        const downloaded = await pipeline.download(resource);
        if (!downloaded || !downloaded.body ||
          (typeof downloaded.body !== 'string' && !downloaded.body.byteLength)) {
          throw new Error('Module source unavailable');
        }
        source = toString(downloaded.body, downloaded.encoding);
        // Preserve the original source for inspection and other references.
        submit(downloaded);
      }
      const converted = classicDemoModule(source);
      if (converted === undefined) throw new Error('Module needs live execution');
      // A data URL is an external classic script, so defer retains module-like
      // timing. Inline classic scripts ignore defer and would run too early.
      script.removeAttr('type integrity crossorigin').empty()
        .attr('src', 'data:text/javascript;base64,' +
          Buffer.from(converted).toString('base64'))
        .attr('defer', '');
    } catch {
      needsLiveExample = true;
      script.remove();
    }
  }
  if (needsLiveExample) {
    const notice = $('<p class="mdn-local-live-example">' +
      'This example requires online JavaScript modules. <a>Open the live example</a>.</p>');
    notice.find('a').attr({href: liveUrl, target: '_blank', rel: 'noopener noreferrer'});
    // Added after link discovery so the live destination is not mirrored again.
    res.meta.liveDemoNotice = notice.toString();
  }
}
