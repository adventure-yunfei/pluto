const path = require('path');
const child_process = require('child_process');
const chalk = require('chalk');
const yargs = require('yargs');
const fse = require('fs-extra');
const _ = require('lodash');

const rootDir = __dirname;
const deployRootDir = path.resolve(rootDir, 'release');

function run(cmd) {
    child_process.execSync(cmd, {
        stdio: ['ignore', 'ignore', 'inherit'],
        cwd: __dirname
    });
}

const _getDeployer = (deployers) => ({
    predeploy() {
        console.log(chalk.green.bold('### 开始生成部署资源...\n'));

        console.log(chalk.green('# 清理资源...'));
        fse.emptyDirSync(deployRootDir);

        deployers
            .filter(deployer => deployer.predeploy)
            .forEach(deployer => {
                console.log(chalk.green.bold(`# 开始为${deployer.name}生成部署资源...`));
                deployer.predeploy();
                console.log('\n');
            });

        console.log(chalk.green.bold('### 部署资源生成完毕.'));
    },

    postdeploy() {
        console.log(chalk.green.bold('### 开始分发部署资源...\n'));

        deployers
            .filter(deployer => deployer.postdeploy)
            .forEach(deployer => {
                console.log(chalk.green.bold(`# 开始为${deployer.name}分发部署资源...`));
                deployer.postdeploy();
                console.log('\n');
            });

        console.log(chalk.green.bold('### 部署资源分发完毕.'));
    },

    startServer() {
        console.log(chalk.green.bold('# 启动服务器...'));

        console.log(chalk.green(' - 启动 nginx 服务器...'));
        run('service nginx start');

        deployers
            .filter(deployer => deployer.startServer)
            .forEach(deployer => {
                console.log(chalk.green.bold(`# 启动${deployer.name}服务器...`));
                deployer.startServer();
                console.log('\n');
            });

        console.log(chalk.green.bold('# 服务器启动完毕.'));
    },

    stopServer() {
        console.log(chalk.green.bold('# 停止服务器...'));

        deployers
            .filter(deployer => deployer.stopServer)
            .forEach(deployer => {
                console.log(chalk.green.bold(`# 停止${deployer.name}服务器...`));
                deployer.stopServer();
                console.log('\n');
            });

        console.log(chalk.green(' - 停止 nginx 服务器...'));
        run('service nginx stop');

        console.log(chalk.green.bold('# 服务器停止完毕.'));
    },

    buildNginxConfig() {
        return deployers.map(deployer => deployer.getNginxConfig())
            .join('\n\n');
    },
});

const getDeployer = () => {
    const deployConfig = require('./deploy.config.json');
    const ensureGetConfig = (configPath) => {
        const val = _.get(deployConfig, configPath);
        if (!val) {
            throw new Error(`缺失必需的配置项: ${configPath}`);
        }
        return val;
    }

    return _getDeployer([
        require('./blog-v2/deploy')({
            deployRootDir,
            domain: 'blog.yunfei.me',
            leancloud_app_id: ensureGetConfig('hexoblog.leancloud-app-id'),
            leancloud_app_key: ensureGetConfig('hexoblog.leancloud-app-key'),
        }),
    ]);
}

yargs
    .command('predeploy', '', (yargs) => {}, (argv) => {
        getDeployer().predeploy();
    })

    .command('postdeploy', '', (yargs) => {}, (argv) => {
        getDeployer().postdeploy();
    })

    .command('config', '', (yargs) => {}, (argv) => {
        const nginxConfig = getDeployer().buildNginxConfig();
        fse.outputFileSync(
            path.resolve(__dirname, 'config/pluto-nginx.conf'),
            nginxConfig
        );
    })

    .command('server', '', (yargs) => {
        return yargs
            .command(['$0', 'start'], '', (yargs) => {}, (argv) => {
                getDeployer().startServer();
            })

            .command('stop', '', (yargs) => {}, (argv) => {
                getDeployer().stopServer();
            });
    })

    .alias('-h', '--help')
    .help()
    .argv;
