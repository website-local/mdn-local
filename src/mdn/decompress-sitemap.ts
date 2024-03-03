import type {DownloadResource} from 'website-scrap-engine/lib/life-cycle/types';
import {ResourceType} from 'website-scrap-engine/lib/resource';
import {promisify} from 'util';
import type {InputType} from 'zlib';
import {gunzip} from 'zlib';

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
  let isGzip = true;
  if (body instanceof ArrayBuffer) {
    body = Buffer.from(body);
  }
  if (Buffer.isBuffer(body)) {
    isGzip = body.readUint8(0) === 0x1f &&
      body.readUint8(1) === 0x8b;
  } else if (body instanceof Uint8Array) {
    isGzip = body[0] === 0x1f &&
      body[1] === 0x8b;
  } else if (typeof body === 'string') {
    isGzip = body.charCodeAt(0) === 0x1f &&
      body.charCodeAt(1) === 0x8b;
  }
  if (!isGzip) {
    // already decompressed
    // make it xml
    res.savePath =
      res.savePath.replace(/.xml.gz$/, '.xml');
    return res;
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
