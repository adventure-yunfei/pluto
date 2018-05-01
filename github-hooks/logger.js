const log4js = require('log4js');
const path = require('path');

log4js.configure({
  appenders: {
    all: { type: 'file', filename: path.resolve(__dirname, 'hooks.log') }
  },
  categories: {
    default: { appenders: ['all'], level: 'debug' }
  }
});

const logger = log4js.getLogger();

module.exports = logger;
