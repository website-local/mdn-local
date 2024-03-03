import type {
  DownloadResource,
  SubmitResourceFunc
} from 'website-scrap-engine/lib/life-cycle/types';
import type {StaticDownloadOptions} from 'website-scrap-engine/lib/options';
import type {
  PipelineExecutor
} from 'website-scrap-engine/lib/life-cycle/pipeline-executor';
import type {Resource} from 'website-scrap-engine/lib/resource';
import {ResourceType} from 'website-scrap-engine/lib/resource';
import {toString} from 'website-scrap-engine/lib/util';
import {error} from 'website-scrap-engine/lib/logger/logger';

export interface MdnSearchIndexItem {
  title?: string;
  url?: string;
}

export async function processSearchJson(
  res: DownloadResource,
  submit: SubmitResourceFunc,
  options: StaticDownloadOptions,
  pipeline: PipelineExecutor
): Promise<DownloadResource | void> {
  if (res.type !== ResourceType.Binary ||
    res.uri?.path() !== `/${options?.meta?.locale}/search-index.json`) {
    return res;
  }
  // encoding here seems always utf8
  const arr: MdnSearchIndexItem[] = JSON.parse(
    toString(res.body, res.encoding || 'utf8'));
  if (!arr?.length) {
    error.warn('empty or invalid search-index.json', res.url);
    return res;
  }
  res.meta.mdnIsSearchJson = true;

  // deduplicate
  const urlSet: Set<string> = new Set();
  const depth: number = res.depth + 1;
  let url: string | void;
  for (let i = 0; i < arr.length; i++) {
    url = arr[i]?.url;
    if (url) {
      urlSet.add(url);
    }
  }

  const urls: string[] = Array.from(urlSet);
  const resources: Resource[] = [];
  let r: Resource | void;
  // noinspection DuplicatedCode
  for (let i = 0, l = urls.length; i < l; i++) {
    url = urls[i];
    r = await pipeline.createAndProcessResource(
      url, ResourceType.Html, depth, null, res);
    if (!r) continue;
    if (!r.shouldBeDiscardedFromDownload) {
      resources.push(r);
    }
  }
  await submit(resources);
  return res;
}
