import {defaultLifeCycle} from 'website-scrap-engine/lib/life-cycle';
import {skipProcess} from './process-url/skip-process';
import {redirectUrl} from './process-url/redirect-url';
import {detectLinkType} from './process-url/detect-link-type';
import {redirectDownloadLink} from './process-url/redirect-download-link';
import {dropResource} from './process-url/drop-resource';
import {redirectUrlAfterFetch} from './process-url/redirect-url-after-fetch';
import {
  defaultDownloadOptions,
  DownloadOptions
} from 'website-scrap-engine/lib/options';

const lifeCycle = defaultLifeCycle();
lifeCycle.linkRedirect.push(skipProcess, redirectUrl);
lifeCycle.detectResourceType.push(detectLinkType);
lifeCycle.processBeforeDownload.push(redirectDownloadLink, dropResource);
lifeCycle.processAfterDownload.unshift(redirectUrlAfterFetch);

const options: DownloadOptions = defaultDownloadOptions(lifeCycle);
options.logSubDir = 'developer.mozilla.org';
options.maxDepth = 8;
options.concurrency = 12;
options.req.headers = {
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36'
};

export default options;
