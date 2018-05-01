const path = require('path');
const child_process = require('child_process');
const process = require('process');

module.exports = function push(payload) {
  if (/master/.test(payload.ref || '')) {
    process.chdir(path.resolve(__dirname, '../..'));
    child_process.execSync('node build.js build');
  }
}
