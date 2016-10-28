var fs = require('fs'),
    child_process = require('child_process'),
    Promise = require('bluebird'),
    commander = require('commander'),
    _ = require('lodash'),
    Mustache = require('mustache'),
    config = require('./config.json');

var PROJ_ROOT = __dirname,
    uwsgi_ini_file = PROJ_ROOT + '/django/djproj-uwsgi.ini',
    uwsgi_pid_file = PROJ_ROOT + '/django/djproj-uwsgi.pid';

function log(msg) { console.log(msg); }
function logCmd(cmd) {
    console.log('# CMD # : ' + cmd);
}
function execAsync(cmd, args, options) {
    var showCmdLog = options && options.showCmdLog,
        showDetailLog = options && options.showDetailLog,
        runOnBackground = options && options.runOnBackground;
    return new Promise(function (resolve, reject) {
        showCmdLog && logCmd([cmd].concat(args).join(' '));
        var cp = child_process.spawn(cmd, args, {
            stdio: runOnBackground || !showDetailLog ? 'ignore' : 'inherit',
            detached: !!runOnBackground
        });
        if (runOnBackground) {
            cp.unref();
            return resolve();
        }
        cp.on('close', function (code, signal) {
            if (code === 0) {
                resolve(signal);
            } else {
                reject(signal);
            }
        });
    });
}
function renderTemplateFile(filepath, context) {
    return new Promise(function (resolve, reject) {
        fs.readFile(filepath, 'utf8', function (err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(Mustache.render(data, context));
            }
        });
    });
}
function onMainCommandFailure(err) {
    log('! ERROR: ' + err);
    process.exit(1);
}
function chdir(dir) {
    process.chdir(dir);
}

commander
    .command('apache-config')
    .description('生成整个Pluto工程的运行于Apache Httpd上的配置文件')
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
                log('  - 停止 react 服务器...');
                chdir(PROJ_ROOT + '/react');
                return execAsync('gulp', ['stop-server']);
            })
            .then(function () {
                log('  - 停止 django uwsgi...');
                return Promise.resolve().then(function () {
                    fs.accessSync(uwsgi_pid_file);
                }).then(function () {
                    return execAsync('uwsgi', ['--stop', uwsgi_pid_file]);
                }, function () {});
            })
            .catch(onMainCommandFailure);
    });

commander
    .command('server')
    .description('启动服务器')
    .action(function () {
        return Promise.resolve()
            .then(function () {
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
                        log('  - 启动 react 服务器...');
                        chdir(PROJ_ROOT + '/react');
                        return execAsync('gulp', ['server', '-p']);
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
    .command('run')
    .description('编译所有工程并启动服务器')
    .action(function () {
        return Promise.resolve()
            .then(function () {
                log('# 编译 STATIC 工程...');
                chdir(PROJ_ROOT + '/static');
                return execAsync('npm', ['install'])
                    .then(function () {
                        return execAsync('gulp', []);
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
                        return execAsync('gulp', ['build', '-p']);
                    });
            })

            .then(function () {
                chdir(PROJ_ROOT);
                return execAsync('node', ['build.js', 'nginx-config'], {showDetailLog: true});
            })

            .then(function () {
                chdir(PROJ_ROOT);
                return execAsync('node', ['build.js', 'server'], {showDetailLog: true});
            })

            .then(function () {
                chdir(PROJ_ROOT);
                return execAsync('node', ['build.js', 'bandwidth'], {showDetailLog: true});
            })

            .catch(onMainCommandFailure);
    });

commander
    .command('bandwidth')
    .description('限制带宽配额')
    .action(function () {
        var Quota = 1024 * 1024 * 1024; // 1GB
        log('# 设置流量配额上限...');
        return new Promise.resolve()
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
    .command('nginx-config')
    .description('生成整个Pluto工程的运行于Nginx上的配置文件')
    .option('-o --output', 'Nginx配置输出文件')
    .action(function () {
        var outputFile = this.output || 'pluto-nginx-config',
            hosts = config.hosts,
            cfgStr = '',
            templatesDir = PROJ_ROOT + '/build-resources/nginx-config-templates',
            addConfigStr = function (renderedConfig) {
                cfgStr += renderedConfig;
            };

        return Promise.resolve()
            .then(function () {
                addConfigStr([
                    '# Config for entrance:',
                    'server {',
                    '    listen      80;',
                    '    root        ' + PROJ_ROOT + '/typescript-entry/build;',
                    '}',
                    ''
                ].join('\n'));
            })
            .then(function () {
                addConfigStr([
                    '# Config for STATIC:',
                    'server {',
                    '    listen      ' + hosts.static.by_port + ';',
                    '    root        ' + PROJ_ROOT + '/static;',
                    '}',
                    ''
                ].join('\n'));
            })
            .then(function () {
                addConfigStr('# Config for Django:\n');
                return renderTemplateFile(templatesDir + '/django', _.assign({}, hosts.django, {
                    root: PROJ_ROOT + '/django'
                })).then(addConfigStr);
            })
            .then(function () {
                addConfigStr('# Config for gitblog:\n');
                return renderTemplateFile(templatesDir + '/gitblog', _.assign({}, hosts.gitblog, {
                    root: PROJ_ROOT + '/blog'
                })).then(addConfigStr);
            })
            .then(function () {
                addConfigStr('# Proxy to map domain to port:\n');
                return Promise.all(_.values(hosts).map(function (host) {
                    if (host.by_port) {
                        return renderTemplateFile(templatesDir + '/domain-to-port-proxy', host).then(addConfigStr);
                    }
                }));
            })
            .then(function () {
                fs.writeFileSync(outputFile, cfgStr);
                log('# Nginx 配置生成完成: ' + outputFile);
            })
            .then(function () {
                return renderTemplateFile(templatesDir + '/django-uwsgi.ini', {root: PROJ_ROOT + '/django'})
                    .then(function (uwsgiINI) {
                        fs.writeFileSync(uwsgi_ini_file, uwsgiINI);
                        log('# Django uWSGI 配置生成完成: ' + uwsgi_ini_file);
                    });
            })
            .catch(onMainCommandFailure);
    });

commander.parse(process.argv);

if (!commander.args.length) {
    commander.help();
}
