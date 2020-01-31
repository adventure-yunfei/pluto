const path = require('path');
const child_process = require('child_process');
const slash = require('slash');
const chalk = require('chalk');
const fse = require('fs-extra');
const utils = require('../deployUtils');

module.exports = function getDeployer({
    domain,
    deployRootDir,
    leancloud_app_id,
    leancloud_app_key,
}) {
    const deployDir = path.resolve(deployRootDir, 'blog-v2');

    function run(cmd) {
        child_process.execSync(cmd, {
            stdio: ['ignore', 'ignore', 'inherit'],
            cwd: __dirname
        });
    }

    return {
        name: 'Hexo Blog',

        predeploy() {
            console.log(chalk.green('- 注入配置文件...'));
            utils.replacePlaceholders(
                path.resolve(__dirname, './themes/landscape/_config.yml'),
                {
                    '#<leancloud-app-id>#': leancloud_app_id,
                    '#<leancloud-app-key>#': leancloud_app_key,
                }
            );

            console.log(chalk.green('- 安装npm包...'))
            run('yarn');

            console.log(chalk.green('- 生成静态网站...'));
            run('npm run generate');
            fse.moveSync(path.resolve(__dirname, 'public'), deployDir);
        },

        getNginxConfig() {
            return (
`# Config for hexo blog
server {
  listen 80;
  server_name ${domain};
  root   ${slash(deployDir)};
}`
            );
        }
    };
};
