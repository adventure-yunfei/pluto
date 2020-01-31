const path = require('path');
const child_process = require('child_process');
const chalk = require('chalk');
const slash = require('slash');
const fse = require('fs-extra');
const _ = require('lodash');
const utils = require('../deployUtils');

module.exports = function getDeployer({
    port,

    mysql_user,
    mysql_passwd,
    baidu_access_key,
    baidu_secret_key,
    baiduAnalytics,
}) {
    const uwsgi_ini_file = path.resolve(__dirname, 'djproj-uwsgi.ini');
    const uwsgi_pid_file = path.resolve(__dirname, 'djproj-uwsgi.pid');

    function run(cmd) {
        child_process.execSync(cmd, {
            stdio: ['ignore', 'ignore', 'inherit'],
            cwd: __dirname
        });
    }

    return {
        name: 'Django',

        postdeploy() {
            console.log(chalk.green('- 注入 Django 运行时配置...'));
            utils.updateJsonFile(
                path.resolve(__dirname, './deploy.config.json'),
                {
                    'mysql-user': mysql_user,
                    'mysql-passwd': mysql_passwd,
                    'baidu-access-key': baidu_access_key,
                    'baidu-secret-key': baidu_secret_key,
                    'baiduAnalytics': baiduAnalytics,
                }
            );

            console.log(chalk.green('- 生成 Django uWSGI 配置...'));
            const uWSGITemplate = fse.readFileSync(path.resolve(__dirname, './django-uwsgi.tpl.ini'), 'utf8');
            fse.outputFileSync(
                uwsgi_ini_file,
                _.template(uWSGITemplate)({
                    root: slash(__dirname)
                })
            );

            console.log(chalk.green('- 安装 Python Packages 依赖...'));
            run('pip install -r requirements.txt');
        },

        getNginxConfig() {
            return (
`# Config for Django
upstream django {
  server unix:${slash(path.resolve(__dirname, 'djproj.sock'))}; # for a file socket
  # server 127.0.0.1:8001; # for a web port socket
}
server {
  listen   127.0.0.1:${port};
  charset  utf-8;

  #location /static {
  #  alias ${slash(path.resolve(__dirname, 'static'))};
  #}

  location / {
    uwsgi_pass  django;
    include     uwsgi_params;
  }
}`
            );
        },

        startServer() {
            console.log(chalk.green('- 启动 django uwsgi...'));
            child_process.spawn('uwsgi', ['--ini', uwsgi_ini_file, '--pidfile', uwsgi_pid_file], {
                cwd: __dirname,
                stdio: 'ignore',
                detached: true,
            }).unref();
        },

        stopServer() {
            console.log(chalk.green('- 停止 django uwsgi...'));
            try {
                run(`uwsgi --stop  ${uwsgi_pid_file}`);
            } catch (e) {}
        },

        // premigrate?: func;
        // postmigrate?: func;
    };
};
