import {
  defaultLifeCycle,
  downloadResource
} from 'website-scrap-engine/lib/life-cycle.js';
import type {DownloadOptions} from 'website-scrap-engine/lib/options.js';
import {defaultDownloadOptions} from 'website-scrap-engine/lib/options.js';
import {processHtml} from 'website-scrap-engine/lib/life-cycle/adapters.js';
import {skipProcess} from './process-url/skip-process.js';
import {redirectUrl} from './process-url/redirect-url.js';
import {detectLinkType} from './process-url/detect-link-type.js';
import {redirectDownloadLink} from './process-url/redirect-download-link.js';
import {dropResource} from './process-url/drop-resource.js';
import {redirectUrlAfterFetch} from './process-url/redirect-url-after-fetch.js';
import {postProcessHtml, preProcessHtml} from './process-html.js';
import {
  postProcessInteractiveExample,
  preProcessInteractiveExample
} from './process-html/process-interactive-examples';
import {processYariSourceMap} from './process-source-maps.js';
import {decompressSitemap} from './decompress-sitemap.js';
import {downloadAndFallback} from './download-and-fallback.js';
import {processSearchJson} from './process-search-json.js';
import {CustomDnsLookup} from './custom-dns-lookup.js';
import {processYariMainCss} from './process-html/process-yari-main-css.js';

const lifeCycle = defaultLifeCycle();
lifeCycle.linkRedirect.push(skipProcess, redirectUrl);
lifeCycle.detectResourceType.push(detectLinkType);
lifeCycle.processBeforeDownload.push(redirectDownloadLink, dropResource);
lifeCycle.processAfterDownload.unshift(
  redirectUrlAfterFetch,
  preProcessHtml,
  processHtml(preProcessInteractiveExample),
  decompressSitemap
);
for (let i = 0; i < lifeCycle.download.length; i++) {
  if (lifeCycle.download[i] === downloadResource) {
    lifeCycle.download[i] = downloadAndFallback;
  }
}
lifeCycle.processAfterDownload.push(
  processHtml(postProcessHtml),
  processHtml(postProcessInteractiveExample),
  processYariSourceMap,
  processSearchJson,
  processYariMainCss
);

const options: DownloadOptions = defaultDownloadOptions(lifeCycle);
options.logSubDir = 'developer.mozilla.org';
options.maxDepth = 8;
options.concurrency = 12;
options.adjustConcurrencyPeriod = 60000;
options.req.headers = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36'
};

const lookup = new CustomDnsLookup();
options.req.dnsCache = lookup;

export default options;
