const path = require('path');
const child_process = require('child_process');
const slash = require('slash');
const chalk = require('chalk');
const fse = require('fs-extra');
const utils = require('../deployUtils');

module.exports = function getDeployer({
    domain,
    deployRootDir,
}) {
    const deployDir = path.resolve(deployRootDir, 'static');

    function run(cmd) {
        child_process.execSync(cmd, {
            stdio: ['ignore', 'ignore', 'inherit'],
            cwd: __dirname
        });
    }

    return {
        name: 'Static Resources',

        predeploy() {
            console.log(chalk.green('- 安装npm包...'))
            run('yarn');

            console.log(chalk.green('- 编译文件...'));
            run('npm run gulp');
            fse.removeSync(deployDir);
            fse.moveSync(path.resolve(__dirname, 'dist'), path.resolve(deployDir, 'dist'));
        },

        postdeploy: false,

        startServer: false,

        stopServer: false,

        getNginxConfig() {
            return `
# Config for STATIC
server {
  listen 80;
  server_name ${domain};
  root   ${slash(deployDir)};
}
`
        }
    };
};
