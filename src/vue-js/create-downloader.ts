import type {StaticDownloadOptions} from 'website-scrap-engine/lib/options';
import path from 'path';
import {SingleThreadDownloader} from 'website-scrap-engine/lib/downloader';
import HttpAgent, {HttpsAgent} from 'agentkeepalive';

export default function createDownloader(
  overrideOptions: Partial<StaticDownloadOptions>,
  host?: string
): Promise<SingleThreadDownloader> {
  if (!overrideOptions.meta) {
    overrideOptions.meta = {};
  }
  if (!overrideOptions.meta.host) {
    overrideOptions.meta.host = host ?? 'vuejs.org';
  }
  if (!overrideOptions.initialUrl) {
    overrideOptions.initialUrl = [`https://${overrideOptions.meta.host}/`];
  }
  if (!Reflect.get(overrideOptions, 'logSubDir')) {
    Reflect.set(overrideOptions, 'logSubDir',
      overrideOptions.meta.host);
  }
  // http2 by default
  if (overrideOptions.meta?.http2 !== false) {
    if (!overrideOptions.req) {
      overrideOptions.req = {};
    }
    overrideOptions.req.http2 = true;
  } else if (overrideOptions.meta?.keepAlive !== false) {
    if (!overrideOptions.req) {
      overrideOptions.req = {};
    }
    if (!overrideOptions.req.agent) {
      overrideOptions.req.agent = {};
    }
    if (!overrideOptions.req.agent.http) {
      overrideOptions.req.agent.http = new HttpAgent();
    }
    if (!overrideOptions.req.agent.https) {
      overrideOptions.req.agent.https = new HttpsAgent();
    }
  }
  const downloader: SingleThreadDownloader =
    new SingleThreadDownloader(path.join(__dirname, 'life-cycle'), overrideOptions);
  return downloader.init.then(() => {
    downloader.start();
    return downloader;
  });
}
