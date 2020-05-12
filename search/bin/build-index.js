const buildIndex = require('../lib/build-index');
const defaultConfig = require('../lib/default-config');

buildIndex(defaultConfig.resolveArgv()).catch(console.error);
