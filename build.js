var child_process = require('child_process'),
    fs = require('fs-extra'),
    path = require('path'),
    commander = require('commander'),
    _ = require('underscore'),
    handlebars = require('handlebars'),
    nodeExecCmd = require('node-exec-cmd'),
    config = require('./config.json');

handlebars.registerHelper('equal', function (a, b, options) {
    if (a === b) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});

var PROJ_ROOT = __dirname,
    CWD = process.cwd(),
    uwsgi_ini_file = PROJ_ROOT + '/django/djproj-uwsgi.ini',
    uwsgi_pid_file = PROJ_ROOT + '/django/djproj-uwsgi.pid',
    LOGS_DIR = path.resolve(PROJ_ROOT, 'logs'),
    nginxLogDir = path.resolve(LOGS_DIR, 'nginx');

function log(msg) { console.log(msg); }
function logCmd(cmd) {
    console.log('# CMD # : ' + cmd);
}
function execAsync(cmd, args, options) {
    return nodeExecCmd([cmd].concat(args || []).join(' '), {
        logCmd: !!options && !!options.showCmdLog,
        logDetail: !!options && !!options.showDetailLog,
        bg: !!options && !!options.runOnBackground
    });
}
function renderTemplateFile(filepath, context) {
    return Promise.resolve().then(function () {
        var fileContent = fs.readFileSync(filepath, 'utf8');
        return handlebars.compile(fileContent)(context);
    });
}
function renderTemplateFile2(filepath, outputPath, context) {
    return Promise.resolve().then(function () {
        var fileContent = fs.readFileSync(filepath, 'utf8');
        var output = handlebars.compile(fileContent)(context);
        fs.writeFileSync(outputPath, output);
    });
}
function onMainCommandFailure(err) {
    log('! ERROR: ' + err);
    process.exit(1);
}
function chdir(dir) {
    process.chdir(dir);
}
function getProp(obj, propPaths) {
    var val = obj;
    propPaths.some(function (key) {
        if (typeof val === 'object') {
            val = val[key];
        } else {
            return true;
        }
    });
    return val;
}

function prepareLogsDir() {
    var logsDirs = [
        nginxLogDir
    ];
    return Promise.resolve().then(() => {
        logsDirs.forEach(logDir => {
            fs.ensureDirSync(logDir);
            fs.chmodSync(logDir, 0775);
        });
    });
}

var RELEASE_DIR = PROJ_ROOT + '/release';

function checkConfigFile() {
    var REQUIRED_CONFIG_KEYS = [
        'default_domain',
        //'blog.duoshuo',
        //'blog.baiduAnalytics',
        'django-photosite.baidu-access-key',
        'django-photosite.baidu-secret-key',
        'django-photosite.baiduAnalytics',
        'react-photosite.baiduAnalytics'
    ];
    var missedKeys = REQUIRED_CONFIG_KEYS.filter(function (keyPath) {
        return !getProp(config, keyPath.split('.'));
    });
    if (missedKeys.length) {
        throw new Error('缺失必需的配置项: ' + missedKeys.join(' , '));
    }
}

commander
    .command('build-release')
    .description('编译部分工程，打包成release包 (包含工程：meteor-killers-game)')
    .action(function () {
        fs.emptyDirSync(RELEASE_DIR);
        return Promise.resolve()
            .then(() => {
                log('# 编译 Meteor Killers Game 发布包...');
                chdir(PROJ_ROOT + '/meteor-killers-game');
                return Promise.resolve().then(function () {
                    log('  - 安装npm包...');
                    return execAsync('npm', ['install']);
                }).then(function () {
                    log('  - 编译meteor压缩包...');
                    return execAsync('meteor', ['build', RELEASE_DIR + '/meteor-killers-game', '--architecture', 'os.linux.x86_64']);
                });
            });
    });

commander
    .command('postbuild-release')
    .description('在release包的基础上，解压包，进行必要的再编译')
    .action(function () {
        return Promise.resolve()
            .then(checkConfigFile)
            .then(() => {
                log('# 处理 Meteor Killers Game 发布包...');
                chdir(RELEASE_DIR + '/meteor-killers-game');
                return Promise.resolve().then(function () {
                    log('  - 解压meteor压缩包...');
                    return execAsync('tar', ['-xf', 'meteor-killers-game.tar.gz']);
                }).then(function () {
                    log('  - 安装meteor服务端依赖的npm包...');
                    chdir('bundle/programs/server');
                    return execAsync('npm', ['install', '--no-shrinkwrap']);
                }).then(function () {
                    log('  - 准备pm2启动配置文件...');
                    chdir('../..');
                    var killersHost = config.hosts.killers_game;
                    fs.writeJSONSync('pm2-process.json', {
                        apps: [{
                            name: 'killers',
                            script: 'main.js',
                            env: {
                                PORT: killersHost.by_port,
                                ROOT_URL: 'http://' + killersHost.by_domain,
                                MONGO_URL: 'mongodb://127.0.0.1:27017/killers-game'
                            }
                        }]
                    });
                });
            })

            .catch(onMainCommandFailure);
    });

commander
    .command('build')
    .description('本地编译工程')
    .action(function () {
        return Promise.resolve()
            .then(checkConfigFile)
            .then(function () {
                log('# 编译 STATIC 工程...');
                chdir(PROJ_ROOT + '/static');
                return Promise.resolve().then(function () {
                    log('  - 安装npm包...');
                    return execAsync('npm', ['install']);
                }).then(function () {
                    log('  - 编译文件...');
                    return execAsync('npm', ['run', 'gulp']);
                });
            })
            .then(function () {
                log('# 编译 Django 工程...');
                chdir(PROJ_ROOT + '/django');
                return execAsync('python', ['build.py']);
            })
            .then(function () {
                log('# 编译 React 工程...');
                chdir(PROJ_ROOT + '/react');
                return Promise.resolve()
                    .then(function () {
                        log('  - 安装npm包...');
                        return execAsync('npm', ['install'])
                    })
                    .then(function () {
                        log('  - 编译文件...');
                        return execAsync('npm', ['run', 'gulp', '---', 'build', '-p']);
                    });
            })
            .then(function () {
                log('# 编译 typescript-entrance 工程...');
                chdir(PROJ_ROOT + '/typescript-entrance');
                return Promise.resolve().then(function () {
                    log('  - 安装npm包...');
                    return execAsync('npm', ['install']);
                }).then(function () {
                    log('  - 编译文件...');
                    return execAsync('npm', ['run', 'build']);
                });
            })
            .then(function () {
                log('# 准备 root-domain-pages 资源...');
                chdir(PROJ_ROOT);
                fs.removeSync('root-domain-pages/ts-entry-static');
                fs.copySync('typescript-entrance/build', 'root-domain-pages');
            })

            .catch(onMainCommandFailure);
    });


commander
    .command('server')
    .description('启动服务器')
    .action(function () {
        return Promise.resolve()
            .then(prepareLogsDir)
            .then(function () {
                log('# 启动服务前, 首先请确保 nginx(apache) 配置文件已设置.\n');
                log('# 启动服务器前首先关闭服务器:');
                return execAsync('node', ['build.js', 'stop-server'], {showDetailLog: true});
            })
            .then(function () {
                log('# 启动服务器...');
                return Promise.resolve()
                    // .then(function () {
                    //     log('  - 启动 apache2 服务器...');
                    //     return execAsync('service', ['apache2', 'start']);
                    // })
                    .then(function () {
                        log('  - 启动 nginx 服务器...');
                        return execAsync('service', ['nginx', 'start']);
                    })
                    .then(function () {
                        log('  - 启动 pm2 - react 服务器...');
                        chdir(PROJ_ROOT + '/react');
                        return execAsync('npm', ['run', 'gulp', '--', 'server', '-p']);
                    })
                    .then(function () {
                        log('  - 启动 pm2 - meteor killers game 服务器...');
                        chdir(RELEASE_DIR + '/meteor-killers-game/bundle');
                        return execAsync(PROJ_ROOT + '/node_modules/.bin/pm2', ['start', 'pm2-process.json']);
                    })
                    .then(function () {
                        log('  - 启动 django uwsgi...');
                        chdir(PROJ_ROOT + '/django');
                        return execAsync('uwsgi', ['--ini', uwsgi_ini_file, '--pidfile', uwsgi_pid_file], {runOnBackground: true});
                    });
            })

            .catch(onMainCommandFailure);
    });


commander
    .command('stop-server')
    .description('停止服务器')
    .action(function () {
        log('# 停止服务器...');
        return Promise.resolve()
            // .then(function () {
            //     log('  - 停止 apache2 服务器...');
            //     return execAsync('service', ['apache2', 'stop']);
            // })
            .then(function () {
                log('  - 停止 nginx 服务器...');
                return execAsync('service', ['nginx', 'stop']);
            })
            .then(function () {
                log('  - 停止 pm2 (react, meteor killers game) 服务器进程...');
                return execAsync(PROJ_ROOT + '/node_modules/.bin/pm2', ['kill']);
            })
            //.then(function () {
            //    log('  - 停止 react 服务器...');
            //    chdir(PROJ_ROOT + '/react');
            //    return execAsync('npm', ['run', 'gulp', '--', 'stop-server']);
            //})
            .then(function () {
                log('  - 停止 django uwsgi...');
                return Promise.resolve().then(function () {
                    fs.accessSync(uwsgi_pid_file);
                }).then(function () {
                    return execAsync('uwsgi', ['--stop', uwsgi_pid_file]).catch(() => {});
                }, function () {});
            })
            .catch(onMainCommandFailure);
    });


commander
    .command('config')
    .description('生成整个Pluto工程的运行配置文件 (nginx, logstash)')
    .action(function () {
        var nginxConfFile = path.resolve(PROJ_ROOT, 'pluto-nginx.conf');
        var logstashConfFile = path.resolve(PROJ_ROOT, 'pluto-logstash.conf');
        var nginxLogDir = path.resolve(PROJ_ROOT, 'logs/nginx');
        var templateDir = path.resolve(PROJ_ROOT, 'build-resources');
        return Promise.resolve()
            .then(() => log('# 开始生成配置文件...'))
            .then(function () {
                return renderTemplateFile2(
                    path.resolve(PROJ_ROOT, 'build-resources/pluto-nginx.conf'),
                    nginxConfFile,
                    {
                        config: config,
                        root: PROJ_ROOT,
                        nginx_log_dir: nginxLogDir
                    }
                ).then(() => log('  - Nginx 配置生成完成: ' + nginxConfFile));
            })
            .then(function () {
                return renderTemplateFile2(
                    path.resolve(templateDir, 'django-uwsgi.ini'),
                    uwsgi_ini_file,
                    {
                        root: path.resolve(PROJ_ROOT, 'django')
                    }
                ).then(() => log('  - Django uWSGI 配置生成完成: ' + uwsgi_ini_file))
            })
            .then(function () {
                return renderTemplateFile2(
                    path.resolve(templateDir, 'pluto-logstash.conf'),
                    logstashConfFile,
                    {
                        nginx_log_dir: nginxLogDir
                    }
                ).then(() => log('  - Logstash 配置生成完成: ' + logstashConfFile));
            })
            .then(() => log('# 配置文件全部生成完成'))
            .catch(onMainCommandFailure);
    });


commander
    .command('bandwidth')
    .description('限制带宽配额')
    .action(function () {
        var Quota = 1024 * 1024 * 1024; // 1GB
        log('# 设置流量配额上限...');
        return Promise.resolve()
            .then(function () {
                log('  - 首先清除iptables OUTPUT规则...');
                return execAsync('iptables', ['-F', 'OUTPUT']);
            })
            .then(function () {
                log('  - 设置流量配额规则...');
                return execAsync('iptables', ('-A OUTPUT -p tcp -m quota --quota ' + Quota + ' -j ACCEPT').split(/\s+/))
                    .then(function () {
                        return execAsync('iptables', '-A OUTPUT -p tcp -j DROP'.split(/\s+/));
                    });
            })
            .catch(onMainCommandFailure);
    });


commander
    .command('apache-config')
    .description('(暂停维护) 生成整个Pluto工程的运行于Apache Httpd上的配置文件')
    .option('-o --output', 'Apache配置输出文件')
    .action(function () {
        var outputFile = this.output || 'pluto-apache-config.conf',
            hosts = config.hosts,
            lines = [],
            mod_lines = [];
        // Listen to all Port that run by apache
        _.forEach(hosts, function (host) {
            if (host.run_by_apache) {
                lines.push('Listen ' + host.by_port);
            }
        });
        lines.push('');

        // Build for static
        lines = lines.concat([
            '<VirtualHost *:' + hosts.static.by_port + '>',
            '    DocumentRoot ' + PROJ_ROOT + '/static',
            '    <Directory ' + PROJ_ROOT + '/static>',
            '        AllowOverride All',
            '        Require all granted',
            '    </Directory>',
            '</VirtualHost>'
        ]);

        // Build for Django
        mod_lines.push('#Load wsgi_module mod_wsgi.so');
        lines = lines.concat([
            'WSGIPythonPath ' + PROJ_ROOT + '/django',
            '<VirtualHost *:' + hosts.django.by_port + '>',
            '    Alias /static ' + PROJ_ROOT + '/django/static',
            '    <Directory ' + PROJ_ROOT + '/django/static>',
            '        Require all granted',
            '    </Directory>',
            '',
            '    WSGIScriptAlias / ' + PROJ_ROOT + '/django/djproj/wsgi.py',
            '    <Directory ' + PROJ_ROOT + '/django/djproj>',
            '        <Files wsgi.py>',
            '        Require all granted',
            '        </Files>',
            '    </Directory>',
            '</VirtualHost>',
            ''
        ]);
        // Build for GitBlog
        mod_lines.push('#Load rewrite_module mod_rewrite.so');
        mod_lines.push('#Load php5_module libphp5.so');
        lines = lines.concat([
            '<VirtualHost *:' + hosts.gitblog.by_port + '>',
            '    DocumentRoot ' + PROJ_ROOT + '/blog',
            '    <Directory ' + PROJ_ROOT + '/blog>',
            '        AllowOverride All',
            '        Require all granted',
            '    </Directory>',
            '</VirtualHost>',
            ''
        ]);

        // Proxy to map domain to port
        mod_lines.push('#Load proxy_module mod_proxy.so');
        mod_lines.push('#Load proxy_module mod_proxy_http.so');
        Object.keys(hosts).map(function(key) { return hosts[key]; }).forEach(function (host) {
            if (host.by_port) {
                lines = lines.concat([
                    '<VirtualHost ' + host.by_domain + ':80>',
                    '    ServerName ' + host.by_domain,
                    '    ProxyRequests Off',
                    '    <Proxy *>',
                    '        Order deny,allow',
                    '        Allow from all',
                    '    </Proxy>',
                    '    ProxyPass / http://localhost:' + host.by_port + '/',
                    '    ProxyPassReverse / http://localhost:' + host.by_port + '/',
                    '</VirtualHost>',
                    ''
                ]);
            }
        });

        // Manually proxy for entrance
        lines = lines.concat([
            '<VirtualHost ' + hosts.entrance.by_domain + ':80>',
            '    ServerName ' + hosts.entrance.by_domain,
            '    ProxyRequests Off',
            '    <Proxy *>',
            '        Order deny,allow',
            '        Allow from all',
            '    </Proxy>',
            '    ProxyPass /static/ http://localhost:' + hosts.django.by_port + '/static/',
            '    ProxyPassReverse /static/ http://localhost:' + hosts.django.by_port + '/static/',
            '    ProxyPass / http://localhost:' + hosts.django.by_port + '/entrance/',
            '    ProxyPassReverse / http://localhost:' + hosts.django.by_port + '/entrance/',
            '</VirtualHost>',
            ''
        ]);

        fs.writeFile(outputFile, mod_lines.concat(['']).concat(lines).join('\n'));
        console.info('Finish: Apache配置生成完成')
    });

commander.parse(process.argv);

if (!commander.args.length) {
    commander.help();
}
