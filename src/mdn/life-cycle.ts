import {
  defaultLifeCycle,
  downloadResource
} from 'website-scrap-engine/lib/life-cycle';
import {
  defaultDownloadOptions,
  DownloadOptions
} from 'website-scrap-engine/lib/options';
import {processHtml} from 'website-scrap-engine/lib/life-cycle/adapters';
import {skipProcess} from './process-url/skip-process';
import {redirectUrl} from './process-url/redirect-url';
import {detectLinkType} from './process-url/detect-link-type';
import {redirectDownloadLink} from './process-url/redirect-download-link';
import {dropResource} from './process-url/drop-resource';
import {redirectUrlAfterFetch} from './process-url/redirect-url-after-fetch';
import {postProcessHtml, preProcessHtml} from './process-html';
import {
  postProcessInteractiveExample,
  preProcessInteractiveExample
} from './process-html/process-interactive-examples';
import {processYariSourceMap} from './process-source-maps';
import {decompressSitemap} from './decompress-sitemap';
import {downloadAndFallback} from './download-and-fallback';

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
  processYariSourceMap
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

export default options;
