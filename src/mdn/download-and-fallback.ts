import type {HTTPError} from 'got';
import {downloadResource} from 'website-scrap-engine/lib/life-cycle';
import type {Resource} from 'website-scrap-engine/lib/resource';
import {ResourceType} from 'website-scrap-engine/lib/resource';
import type {
  DownloadResource,
  RequestOptions
} from 'website-scrap-engine/lib/life-cycle/types';
import type {StaticDownloadOptions} from 'website-scrap-engine/lib/options';
import {isUrlHttp} from 'website-scrap-engine/lib/util';
import {notFound} from 'website-scrap-engine/lib/logger/logger';


export async function downloadAndFallback(
  res: Resource,
  requestOptions: RequestOptions,
  options: StaticDownloadOptions
): Promise<DownloadResource | Resource | void> {
  if (res.body) {
    return res as DownloadResource;
  }
  if (res.type === ResourceType.StreamingBinary) {
    return res;
  }
  if (!isUrlHttp(res.downloadLink)) {
    return res;
  }
  const mdnLocalizedUrlPrefix =
    `https://developer.mozilla.org/${options.meta.locale}/`;
  // do nothing for en-US or non-mdn url
  if (options.meta.locale as string === 'en-US' ||
    !res.url.startsWith(mdnLocalizedUrlPrefix)) {
    return downloadResource(res, requestOptions, options);
  }
  // not en-US
  try {
    return await downloadResource(res, requestOptions, options);
  } catch (err) {
    // force cast for typescript 4.4
    // can we use an instanceof check here?
    if (err && (err as {name?: string | void}).name === 'HTTPError' &&
      (err as HTTPError)?.response?.statusCode === 404) {
      notFound.warn('falling back localized 404 resource to en-US',
        res.downloadLink, res.refUrl);
      // fallback to en-US
      res.downloadLink = 'https://developer.mozilla.org/en-US/' +
        res.downloadLink.slice(mdnLocalizedUrlPrefix.length);
      return await downloadResource(res, requestOptions, options);
    } else {
      throw err;
    }
  }
}
