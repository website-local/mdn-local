const {Resource, HtmlResource} = require('./link');
const Queue = require('p-queue');
const process = require('./process');
const defaultOptions = require('./options');

class Downloader {
  constructor(options) {
    options = Object.assign({}, defaultOptions, options);
    this.options = options;
    /**
     * @type Queue
     */
    this.queue = new Queue(options);
    this.queuedLinks = {};
    this.downloadedLinks = {};
    this.failedLinks = {};
    const dropResourceFunc = options.dropResourceFunc;
    const self = this;
    /**
     * @param {Resource} res
     * @return {boolean}
     */
    options.dropResourceFunc = (res) => {
      if (dropResourceFunc && dropResourceFunc(res)) {
        return true;
      }
      return self.queuedLinks[res._downloadLink];
    };
    if (options.beginUrl && options.localRoot) {
      this.add(new HtmlResource(
        options.beginUrl, options.localRoot, options.beginUrl, options));
    }
  }
  add(resource) {
    if (!(resource instanceof Resource)) {
      return false;
    }
    const url = resource._downloadLink;
    if (this.queuedLinks[url]) {
      return true;
    }
    if (resource.depth > resource.options.depth) {
      return false;
    }
    const self = this;
    if (resource instanceof HtmlResource) {
      this.queue.add(async () => {
        try {
          {
            const {htmlArr, resArr} = await process(resource);
            for (const html of htmlArr) {
              self.add(html);
            }
            for (const res of resArr) {
              self.add(res);
            }
          }
          await resource.save();
          // eslint-disable-next-line no-console
          console.debug(url);
          self.downloadedLinks[url] = 1;
          resource = null;
        } catch (e) {
          self.handleError(e, url, resource);
        }
      });
    } else {
      this.queue.add(async () => {
        try {
          await resource.save();
          // eslint-disable-next-line no-console
          console.debug(url);
          self.downloadedLinks[url] = 1;
          resource = null;
        } catch (e) {
          self.handleError(e, url, resource);
        }
      });
    }

    this.queuedLinks[url] = 1;
    return true;
  }
  handleError(error, url, resource) {
    if (error && typeof this.options.onError === 'function') {
      this.options.onError(this, error, url, resource);
    }
    this.failedLinks[url] = 1;
    // eslint-disable-next-line no-console
    console.error(error, url, resource);
  }
  start() {
    this.finished = 0;
    this.queue.onIdle().then(() => {
      this.finished = 1;
      if (typeof this.options.onSuccess === 'function') {
        this.options.onSuccess(this, this.finished);
      }
    });
    return this.queue.start();
  }

  stop() {
    this.queue.pause();
  }
}
module.exports = Downloader;