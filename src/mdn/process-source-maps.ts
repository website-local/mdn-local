import {processSourceMap} from 'website-scrap-engine/lib/life-cycle/process-source-map';
import {
  DownloadResource,
  SubmitResourceFunc
} from 'website-scrap-engine/lib/life-cycle/types';
import {StaticDownloadOptions} from 'website-scrap-engine/lib/options';
import {PipelineExecutor} from 'website-scrap-engine/lib/life-cycle/pipeline-executor';
import {AsyncResult} from 'website-scrap-engine/lib/life-cycle/types';
import {ResourceType} from 'website-scrap-engine/lib/resource';

export function processYariSourceMap(
  res: DownloadResource,
  submit: SubmitResourceFunc,
  options: StaticDownloadOptions,
  pipeline: PipelineExecutor): AsyncResult<DownloadResource | void> {
  if (res.type !== ResourceType.Html &&
    res.type !== ResourceType.Svg &&
    res.downloadLink.startsWith('https://developer.mozilla.org/static/') && (
    res.uri?.path()?.endsWith('.js') || res.uri?.path()?.endsWith('.css'))) {
    return processSourceMap(res, submit, options, pipeline);
  }
  return res;
}