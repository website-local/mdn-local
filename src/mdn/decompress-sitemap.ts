import type {DownloadResource} from 'website-scrap-engine/lib/life-cycle/types';
import {ResourceType} from 'website-scrap-engine/lib/resource';
import {promisify} from 'util';
import {gunzip, InputType} from 'zlib';
const gunzipAsync = promisify(gunzip);

/**
 * Currently only MDN yari uses a .xml.gz file as sitemap,
 * this function would decompress these sitemap to xml
 *
 * See https://github.com/website-local/mdn-local/issues/214
 */
export const decompressSitemap = async (
  res: DownloadResource
): Promise<DownloadResource> => {
  if (res.type !== ResourceType.SiteMap) {
    return res;
  }
  if (!res.savePath.endsWith('.xml.gz') || !res.body) {
    return res;
  }
  let body: InputType;
  if (typeof res.body === 'string' ||
    Buffer.isBuffer(res.body) ||
    res.body instanceof ArrayBuffer) {
    body = res.body;
  } else {
    body = Buffer.from(res.body.buffer,
      res.body.byteOffset, res.body.byteLength);
  }
  const decompressedBody = await gunzipAsync(body);
  if (decompressedBody) {
    res.body = decompressedBody;
    // make it xml
    res.savePath =
      res.savePath.replace(/.xml.gz$/, '.xml');
  }
  return res;
};
