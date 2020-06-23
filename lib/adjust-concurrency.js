const logger = require('log4js').getLogger('adjust-concurrency');
/**
 * @param {Downloader} downloader
 */
const adjust = (downloader) => {
  if (!downloader.firstPeriodCount) {
    downloader.firstPeriodCount = Object.keys(downloader.downloadedLinks).length;
    downloader.lastPeriodTotalCount =
      downloader.currentPeriodCount =
        downloader.lastPeriodCount =
          downloader.firstPeriodCount;
    return;
  }
  const total = Object.keys(downloader.downloadedLinks).length;
  downloader.lastPeriodCount = downloader.currentPeriodCount;
  downloader.currentPeriodCount = total - downloader.lastPeriodTotalCount;
  downloader.lastPeriodTotalCount = total;
  if (downloader.queue.size === 0) {
    return logger.info('Queue is empty, keep concurrency as ',
      downloader.queue.concurrency, 'pending items: ', downloader.queue.pending);
  }
  let concurrency = downloader.queue.concurrency;
  if (downloader.currentPeriodCount < 2) {
    concurrency += 8;
  } else if (downloader.currentPeriodCount < downloader.lastPeriodCount >> 1) {
    concurrency += 4;
  }
  if (downloader.currentPeriodCount < downloader.firstPeriodCount >> 2) {
    concurrency += 2;
  }

  if (downloader.currentPeriodCount > downloader.lastPeriodCount << 2) {
    concurrency -= 4;
  } else if (downloader.currentPeriodCount > downloader.lastPeriodCount << 1) {
    concurrency -= 2;
  } else if (downloader.currentPeriodCount > downloader.firstPeriodCount) {
    concurrency -= 2;
  }
  downloader.queue.concurrency = Math.max(downloader.options.minConcurrency, concurrency);
  logger.info('concurrency', downloader.queue.concurrency,
    'queue size:', downloader.queue.size);
};

module.exports = adjust;
