const server = require('../lib/server');
const defaultConfig = require('../lib/default-config');

server(defaultConfig.resolveArgv()).catch(console.error);
