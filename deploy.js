const path = require('path');
const child_process = require('child_process');
const chalk = require('chalk');
const yargs = require('yargs');
const fse = require('fs-extra');
const _ = require('lodash');

/*
deployer: {
    name: string;
    predeploy?: func;
    postdeploy?: func;
    getNginxConfig?: () => string;

    startServer?: func;
    stopServer?: func;
};
*/

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

        console.log(chalk.green.bold('# 清理资源...'));
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

    getNginxConfig() {
        return deployers
            .filter(deployer => deployer.getNginxConfig)
            .map(deployer => deployer.getNginxConfig())
            .join('\n\n\n');
    },
});

const getDeployer = () => {
    const config = require('./config.json');
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
            domain: config.hosts.hexoblog.by_domain,
            deployRootDir,
            leancloud_app_id: ensureGetConfig('hexoblog.leancloud-app-id'),
            leancloud_app_key: ensureGetConfig('hexoblog.leancloud-app-key'),
        }),

        require('./static/deploy')({
            domain: config.hosts.static.by_domain,
            deployRootDir,
        }),

        require('./django/deploy')({
            port: config.hosts.django.by_port,
            mysql_user: ensureGetConfig('django-photosite.mysql-user'),
            mysql_passwd: ensureGetConfig('django-photosite.mysql-passwd'),
            baidu_access_key: ensureGetConfig('django-photosite.baidu-access-key'),
            baidu_secret_key: ensureGetConfig('django-photosite.baidu-secret-key'),
            baiduAnalytics: ensureGetConfig('django-photosite.baiduAnalytics'),
        }),

        require('./react/deploy')({
            domains: [
                'photo.yunfei.me',
                'game2048.yunfei.me',
            ],
            port: config.hosts.react.by_port,
            deployRootDir,
            djangoApiServerPort: config.hosts.django.by_port,
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
        console.log(chalk.green.bold('### 开始生成 Nginx 配置文件...'));
        const nginxConfig = getDeployer().getNginxConfig();
        fse.outputFileSync(
            path.resolve(__dirname, 'config/pluto-nginx.conf'),
            nginxConfig
        );
        console.log(chalk.green.bold('### Nginx 配置文件生成完成.'));
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
