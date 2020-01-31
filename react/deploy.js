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
    const clientBuildDir = path.resolve(__dirname, 'build');
    const serverBuildDir = path.resolve(__dirname, 'server-build');
    const clientDeployDir = path.resolve(deployRootDir, 'react/client');
    const serverDeployDir = path.resolve(deployRootDir, 'react/server');

    function run(cmd) {
        child_process.execSync(cmd, {
            stdio: ['ignore', 'ignore', 'inherit'],
            cwd: __dirname
        });
    }

    return {
        name: 'React',

        predeploy() {
            console.log(chalk.green('- 注入配置文件...'));
            utils.replacePlaceholders(
                path.resolve(__dirname, './app/server/config.js'),
                {
                    '<api-server>': `http://127.0.0.1:${djangoApiServerPort}`,
                    '<port>': `${port}`,
                }
            );

            console.log(chalk.green('- 安装npm包...'))
            run('yarn');

            console.log(chalk.green('- 编译 client 文件...'));
            run('npm run gulp -- build -p');
            fse.moveSync(clientBuildDir, clientDeployDir);

            console.log(chalk.green('- 编译 server 文件...'));
            run('npm run gulp -- build-server');
            fse.moveSync(serverBuildDir, serverDeployDir);
        },

        postdeploy() {
            console.log(chalk.green('- 解压 client 文件...'));
            fse.removeSync(clientBuildDir);
            fse.moveSync(clientDeployDir, clientBuildDir);

            console.log(chalk.green('- 解压 server 文件...'));
            fse.removeSync(serverBuildDir);
            fse.moveSync(serverDeployDir, serverBuildDir);

            console.log(chalk.green('- 安装 server npm 依赖...'));
            run('yarn --production');
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
            run('EXEC_PROD_SERVER=start_server node prod_server_script.js');
        },

        stopServer() {
            console.log(chalk.green('- 启动 pm2 - react 服务器...'));
            run('EXEC_PROD_SERVER=stop_server node prod_server_script.js');
        },
    };
};
