const path = require('path');
const child_process = require('child_process');
const process = require('process');
const logger = require('../logger');

function exec(cmd) {
  return new Promise((resolve, reject) => {
    child_process.exec(cmd, (error, stdout, stderr) => {
      const res = { error, stdout, stderr };
      if (error) {
        reject(res);
      } else {
        resolve(res);
      }
    });
  });
}

let rebuilding;

module.exports = function push(payload) {
  if (/master/.test(payload.ref || '')) {
    const rebuild = () => {
      const triggerTime = Date.now();
      logger.info(`trigger re-build ${triggerTime}...`);
      process.chdir(path.resolve(__dirname, '../..'));
      const buildEnd = () => rebuilding = undefined;
      rebuilding = Promise.resolve()
        .then(() => exec('git pull'))
        .then(() => exec('node build.js build'))
        .then(() => {
          logger.info(`re-build ${triggerTime} succeeded.`);
          rebuilding = undefined;
        })
        .catch((error) => {
          error = error && error.error || error;
          logger.error(`re-build ${triggerTime} failed: ${error && error.toString()}`);
          rebuilding = undefined;
        });
    };

    rebuilding = Promise.resolve(rebuilding)
      .then(rebuild, rebuild);
  }
}
