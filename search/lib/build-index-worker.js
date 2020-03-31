const es = require('@elastic/elasticsearch');
const cheerio = require('cheerio');
const worker = require('worker_threads');
const fs = require('fs');
const path = require('path');
const escapeHtml = require('./escape-html');
/** @type SearchConfig */
const config = worker.workerData;
const client = new es.Client(config.elasticsearch);

if (worker.isMainThread) {
  throw new TypeError('worker running in main thread');
}

let queue = [];
let processing = false;

const process = async () => {
  processing = true;
  let entry;
  while ((entry = queue.shift())) {
    try {
      let p = path.join(config.rootDir, entry);
      let fileData = await fs.promises.readFile(p, {encoding: 'utf8'});
      let $ = cheerio.load(fileData);
      let title = $('title').text();
      let content = $('#content').text();
      let summary = $('.summary').text();
      let time = $('.last-modified time').attr('datetime');
      let breadcrumb = $('.breadcrumbs li').text();
      if (!content || !(content = content.trim())) {
        worker.parentPort.postMessage({
          entry,
          status: 'empty'
        });
        continue;
      }
      await client.index({
        id: entry,
        index: config.esIndex,
        body: {
          title: escapeHtml(title)
            .replace(/| MDN$/i, ''),
          time: time,
          breadcrumb: escapeHtml(breadcrumb)
            .replace(/\s{2,}/g, ' '),
          content: escapeHtml(content)
            .replace(/\s{2,}/g, ' '),
          summary: escapeHtml(summary)
            .replace(/\s{2,}/g, ' ')
        }
      });
    } catch (e) {
      console.error(e && e.body);
      worker.parentPort.postMessage({
        entry,
        status: 'error',
        error: e
      });
      processing = false;
      return;
    }
    worker.parentPort.postMessage({
      entry,
      status: 'success',
    });
  }
  processing = false;
};

worker.parentPort.on('message', (entry) => {
  queue.push(entry);
  if (!processing) process();
});