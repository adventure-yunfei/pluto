const path = require('path');
const child_process = require('child_process');
const chalk = require('chalk');
const fse = require('fs-extra');
const utils = require('../deployUtils');

module.exports = function getDeployer({
    domains,
    port,
    deployRootDir,
    djangoApiServerPort,
}) {
    const deployDir = path.resolve(deployRootDir, 'react');

    function run(cmd) {
        child_process.execSync(cmd, {
            stdio: ['ignore', 'ignore', 'inherit'],
            cwd: __dirname
        });
    }

    return {
        name: 'React',

        predeploy() {
            console.log(chalk.green('- 安装npm包...'))
            run('yarn');

            console.log(chalk.green('- 编译文件...'));
            run('npm run gulp -- build -p');
            fse.removeSync(deployDir);
            fse.moveSync(path.resolve(__dirname, 'build'), deployDir);
        },

        postdeploy() {
            console.log(chalk.green('- 解压静态资源...'));
            const buildDir = path.resolve(__dirname, 'build');
            fse.removeSync(buildDir);
            fse.moveSync(deployDir, buildDir);

            console.log(chalk.green('- 注入配置文件...'));
            utils.replacePlaceholders(
                path.resolve(__dirname, './app/server/config.js'),
                {
                    '<api-server>': `http://127.0.0.1:${djangoApiServerPort}`,
                    '<port>': `${port}`,
                }
            );
        },

        getNginxConfig() {
            return (
`# Config for React
server {
  listen      80;
  server_name ${domains.join(' ')};
  location / {
    proxy_pass http://127.0.0.1:${port}/;
  }
}`
            );
        },

        startServer() {
            console.log(chalk.green('- 启动 pm2 - react 服务器...'));
            run('npm run gulp -- server -p');
        },

        stopServer() {
            console.log(chalk.green('- 启动 pm2 - react 服务器...'));
            run('npm run gulp -- stop-server');
        },
    };
};
