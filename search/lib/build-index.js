const glob = require('fast-glob');
const worker = require('worker_threads');
const log4js = require('log4js');
const path = require('path');
const es = require('@elastic/elasticsearch');
const configureLogger = (dir) => log4js.configure({
  appenders: {
    'file': {
      type: 'file',
      filename: path.join(dir, 'build-index.log')
    },
    'stderr': {
      type: 'stderr'
    }
  },
  categories: {
    'empty': {
      appenders: ['file'],
      level: 'debug'
    },
    'success': {
      appenders: ['file'],
      level: 'debug'
    },
    'error': {
      appenders: ['stderr', 'file'],
      level: 'debug'
    },
    'default': {
      appenders: ['stderr', 'file'],
      level: 'debug'
    }
  }
});

const logger = {
  empty: log4js.getLogger('empty'),
  success: log4js.getLogger('success'),
  error: log4js.getLogger('error'),
};

/**
 * @param {SearchConfig} config
 * @param {ElasticSearchClient} client
 * @return {Promise<void>}
 */
const configIndex = async (config, client) => {
  let ret = await client.indices.exists({
    index: config.esIndex
  });
  if (!ret.body && (config.esIndexSetting || config.esIndexMapping)) {
    await client.indices.create({
      index: config.esIndex
    });
    await client.indices.close({
      index: config.esIndex
    });
    if (config.esIndexSetting) {
      await client.indices.putSettings({
        index: config.esIndex,
        body: config.esIndexSetting
      });
    }
    if (config.esIndexMapping) {
      await client.indices.putMapping({
        index: config.esIndex,
        body: config.esIndexMapping
      });
    }
    await client.indices.open({
      index: config.esIndex
    });
  }
};

/**
 * @param {SearchConfig} config
 * @return {Promise<void>}
 */
module.exports = async (config) => {
  if (!worker.isMainThread) {
    throw new TypeError('main script running in worker thread');
  }

  let entryCount = 0, completed = false, resolve;
  /** @type Worker[] */
  let workers = [];
  const end = () => {
    workers.forEach(w => w.terminate());
    if (resolve) {
      resolve();
    }
  };
  const initWorker = () => {
    let c = config.workersForBuildingIndex;
    if (!c) {
      c = require('os').cpus().length - 1;
    }
    let w;
    for (let i = 0; i < c; i++) {
      workers.push(w = new worker.Worker(path.join(__dirname, 'build-index-worker.js'), {
        workerData: config
      }));
      w.on('message', (msg) => {
        if (msg.status === 'error') {
          logger.error.error(msg.entry, msg.error, msg.error.body);
        } else {
          logger[msg.status].info(msg.entry);
        }
        if (--entryCount <= 0 && completed) {
          logger.success.info('Probably finished');
          client.indices.flush({
            index: config.esIndex
          }).then(end);
        }
      });
    }
  };

  const buildIndex = async () => {
    let stream = glob.stream(config.locale + '/docs/**/*.html', {
      cwd: config.rootDir,
      absolute: false
    });
    let currentWorker = 0, maxWorkers = workers.length;
    for await (const entry of stream) {
      workers[currentWorker++].postMessage(entry);
      if (currentWorker >= maxWorkers) {
        currentWorker = 0;
      }
      ++entryCount;
    }
    completed = true;
  };
  const client = new es.Client(config.elasticsearch);

  configureLogger(config.logPath);
  initWorker();
  await configIndex(config, client);
  await buildIndex();
  return new Promise(r => resolve = r);
};
