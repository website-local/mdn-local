import type {
  DownloaderWithMeta
} from 'website-scrap-engine/src/downloader/types.js';
import type {
  PipelineExecutor
} from 'website-scrap-engine/lib/life-cycle/pipeline-executor.js';
import type {
  AbstractDownloader
} from 'website-scrap-engine/lib/downloader/index.js';
import {ResourceType} from 'website-scrap-engine/lib/resource.js';

export async function interactiveExampleDeps(
  pipeline: PipelineExecutor,
  downloader?: DownloaderWithMeta) {
  if (!downloader) return;
  const d = downloader as AbstractDownloader;
  const codemirror = await pipeline.createResource(
    ResourceType.Binary, 0,
    'https://developer.mozilla.org/static/js/codemirror.js',
    'https://developer.mozilla.org/static/js/inject.js',
  );
  codemirror.downloadLink = 'https://codemirror.net/codemirror.js';
  d.addProcessedResource(codemirror);
  const watify = await pipeline.createResource(
    ResourceType.Binary, 0,
    'https://developer.mozilla.org/static/js/watify.js',
    'https://developer.mozilla.org/static/js/inject.js',
  );
  watify.downloadLink = 'https://unpkg.com/@mdn/watify@1.1.3/watify.js';
  d.addProcessedResource(watify);
  const watifyWasm = await pipeline.createResource(
    ResourceType.Binary, 0,
    'https://developer.mozilla.org/static/js/watify_bg.wasm',
    'https://developer.mozilla.org/static/js/inject.js',
  );
  watifyWasm.downloadLink = 'https://unpkg.com/@mdn/watify@1.1.3/watify_bg.wasm';
  d.addProcessedResource(watifyWasm);
}
