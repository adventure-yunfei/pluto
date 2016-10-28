# <s>Steps for Pluto to Take Off</s> (暂停维护Apache启动方式)

## Django Project

###### 1. 安装 mod_wsgi

Mac OS X: shell=> brew install mod_wsgi

Linux: shell=> apt-get install libapache2-mod-wsgi

###### 2. 配置服务器 Apache2 VirtualHost - httpd.conf / httpd-vhost.conf

```
# 加载 mod_wsgi 模块
LoadModule wsgi_module /usr/local/Cellar/mod_wsgi/4.4.11/libexec/mod_wsgi.so
# 添加工程路径以加载工程Python模块
WSGIPythonPath /Users/yunfei/workshop/djproj
# 配置Django工程服务器域名
<VirtualHost *:>
    ServerName django.yunfei.me

    # 配置静态文件服务
    Alias /static /Users/yunfei/workshop/djproj/static
    <Directory /Users/yunfei/workshop/djproj/static>
        Require all granted
    </Directory>

    # 配置Django工程URL根路径: {url_context} {wsgi.py path}
    WSGIScriptAlias / /Users/yunfei/workshop/djproj/djproj/wsgi.py
    <Directory /Users/yunfei/workshop/djproj/djproj>
        <Files wsgi.py>
        Require all granted
        </Files>
    </Directory>
</VirtualHost>
```

###### 3. 执行脚本 `build.py`


## Java-servlet Project

###### 1. 安装jdk 8

Ubuntu: Ubuntu暂无最新的jdk 8, 手动下载更新方式:
* 在Oracle官网下载jdk 8, 解压到 `/usr/lib/jvm`
* 配置其为默认java: 通过`update-java-alternatives` 或 `update-alternatives` 指向解压目录 (如若 gradle build 仍不通过，可修改jvm目录下的`default-java`link目标)

###### 2. 安装 tomcat7+, gradle

###### 3. 安装 couchdb, 以及可视化工具 fauxton(by npm)

###### 4. 编译war包 (`gradle war`), 并通过tomcat部署在根目录(ROOT)下

Ubuntu: tomcat脚本目录 `/usr/share/tomcat7`, 配置及部署目录 `/var/lib/tomcat7/`
 
启动tomcat需配置环境变了 `JAVA_HOME` 以使用指定的jdk8 


## GitBlog

###### 1. 环境要求: PHP 5.2.4

###### 2. 配置 Apache

* 启用模块: php5_module, rewrite_module
* 配置虚拟主机如下:
```
<VirtualHost *:8001>
    DocumentRoot /workshop/gitblog # 文档目录指向gitblog工程根目录
    <Directory /workshop/gitblog> # 设置gitblog根目录权限
        AllowOverride All # 此条用以启用gitblog目录下 .htaccess 文件覆写规则
        Require all granted
    </Directory>
</VirtualHost>
```

###### 3. 更改网站主题

修改gitblog根目录下 `conf.yaml` 中 `theme` 项，值为 `theme` 目录下的各主体名(文件夹名)


参考:

* [GitBlog-Apache配置官方文档](http://gitblogdoc.sinaapp.com/blog/gitblog/apache.html)。
* [GitBlog官网](http://www.gitblog.cn)。

## 反向代理整合各个服务器端口

配置 Apache2 VirtualHost, 在80端口内转发其他端口服务内容 (某些服务器不能一并通过apache部署在80端口)

    # 转发java-servlet (端口为tomcat端口, 默认8080)
    <VirtualHost *:80>
        ServerName java-servlet.yunfei.me
        
        ProxyRequests Off
        <Proxy *>
            Order deny,allow
            Allow from all
        </Proxy>
    
        ProxyPass / http://localhost:8080/
        ProxyPassReverse / http://localhost:8080/
    </VirtualHost>