import {SingleThreadDownloader} from 'website-scrap-engine/lib/downloader';
import {StaticDownloadOptions} from 'website-scrap-engine/lib/options';
import {CookieJar} from 'tough-cookie';
import {HOST} from './life-cycle';
import path from 'path';
import HttpAgent, {HttpsAgent} from 'agentkeepalive';

export class ElectronJsDownloader extends SingleThreadDownloader {

  constructor(public pathToOptions: string,
    overrideOptions?: Partial<StaticDownloadOptions> & { pathToWorker?: string }) {
    super(pathToOptions, overrideOptions);
    const locale: string = this.options.meta.locale as string || 'en-US';
    const cookieJar = this.options.req.cookieJar = new CookieJar();
    cookieJar.setCookieSync(
      'language=' + locale, `https://${HOST}`);

    if (!this.options.req.headers) {
      this.options.req.headers = {};
    }
    if (!this.options.req.headers['accept-language']) {
      this.options.req.headers['accept-language'] = locale;
    }
    // http2 not supported yet, use http 1.1 keep-alive by default
    if (this.options.meta?.keepAlive !== false) {
      if (!this.options.req.agent) {
        this.options.req.agent = {};
      }
      this.options.req.agent.http = new HttpAgent();
      this.options.req.agent.https = new HttpsAgent();
    }
  }
}

export default function createDownloader(
  overrideOptions: Partial<StaticDownloadOptions>,
  locale?: string
): Promise<ElectronJsDownloader> {
  if (locale) {
    if (!overrideOptions.meta) {
      overrideOptions.meta = {};
    }
    overrideOptions.meta.locale = locale;
  }
  const downloader: ElectronJsDownloader =
    new ElectronJsDownloader(path.join(__dirname, 'life-cycle'), overrideOptions);
  return downloader.init.then(() => {
    downloader.start();
    return downloader;
  });
}
