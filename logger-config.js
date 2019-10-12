const log4js = require('log4js');
const path = require('path');

const configureLogger = (localRoot) =>
  log4js.configure({
    appenders: {
      'retry': {
        type: 'file',
        filename: path.join(localRoot, 'developer.mozilla.org', 'logs', 'retry.log')
      },
      'mkdir': {
        type: 'file',
        filename: path.join(localRoot, 'developer.mozilla.org', 'logs', 'mkdir.log')
      },
      'error': {
        type: 'file',
        filename: path.join(localRoot, 'developer.mozilla.org', 'logs', 'error.log')
      },
      'skip': {
        type: 'file',
        filename: path.join(localRoot, 'developer.mozilla.org', 'logs', 'skip.log')
      },
      '404': {
        type: 'file',
        filename: path.join(localRoot, 'developer.mozilla.org', 'logs', '404.log')
      },
      'complete': {
        type: 'file',
        filename: path.join(localRoot, 'developer.mozilla.org', 'logs', 'complete.log')
      },
      'stdout': {
        type: 'stdout'
      },
      'stderr': {
        type: 'stderr'
      }
    },

    categories: {
      'retry': {
        appenders: ['stdout', 'retry'],
        level: 'debug'
      },
      'mkdir': {
        appenders: ['mkdir'],
        level: 'debug'
      },
      'error': {
        appenders: ['stderr', 'error'],
        level: 'debug'
      },
      'skip': {
        appenders: ['stdout', 'skip'],
        level: 'debug'
      },
      '404-not-found': {
        appenders: ['404'],
        level: 'debug'
      },
      'complete': {
        appenders: ['complete'],
        level: 'debug'
      },
      'adjust-concurrency': {
        appenders: ['stdout', 'complete'],
        level: 'debug'
      },
      'default': {
        appenders: ['stdout', 'complete'],
        level: 'debug'
      }
    }
  });

module.exports = configureLogger;