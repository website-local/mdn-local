const {Resource, HtmlResource} = require('./link');
const Queue = require('queue');
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

    this.queue.push(callback => {
      const errHandler = error => {
        // eslint-disable-next-line no-console
        console.error(error, resource);
        if (error && error.statusCode === 404) {
          callback();
        } else {
          callback(error);
        }
      };
      if (resource instanceof HtmlResource) {
        process(resource).then(({htmlArr, resArr}) => {
          for (const html of htmlArr) {
            self.add(html);
          }
          for (const res of resArr) {
            self.add(res);
          }
        }).then(() => callback(null, resource.save())).then(()=>{
          self.downloadedLinks[url] = 1;
        })
          .catch(errHandler);
      } else {
        resource.save().then(() => {
          self.downloadedLinks[url] = 1;
        })
          .catch(errHandler);
      }
    });
    this.queuedLinks[url] = 1;
    return true;
  }
  start() {
    this.finished = 0;
    return this.queue.start(error => {
      this.error = error;
      this.finished = 1;
      if (!error && typeof this.options.onSuccess === 'function') {
        this.options.onSuccess(this);
      } else if (error && typeof this.options.onError === 'function') {
        this.options.onError(this);
      }
    });
  }

  stop() {
    this.queue.stop();
  }
}
module.exports = Downloader;