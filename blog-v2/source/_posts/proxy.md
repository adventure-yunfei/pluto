---
title: Squid + stunnel 搭建HTTP代理
date: 2016-05-02
tags:
- proxy
---

原理:

```
使用 squid 搭建http代理。
然后通过 stunnel 创建客户端到代理服务器的加密连接。

连接图： **浏览器** --(http代理)--> **stunnel客户端(国内)** --(stunnel加密连接)--> **服务端stunnel** --(转发)--> **服务端squid** --(squid http代理)--> **内容服务器**

```

<!-- more -->

### 服务端配置

##### 1. 安装 squid, stunnel, openssl

##### 2. 启动 squid http代理

配置 squid

```
http_port 3128 # squid 默认端口 3128
...
http_access allow all # 加在 http_access deny all 之前，用于允许任何请求 (谨慎使用!)
```



##### 3. 启动 stunnel 服务端

- 创建证书 `openssl req -new -keyout privatekey.pem -nodes -x509 -days 365 -out publiccert.pem`
- 合并 `cat privatekey.pem publiccert.pem >> stunnel.pem`
- 配置服务端 stunnel `/etc/stunnel/stunnel.conf`

```
client = no
[sproxy]
accept = 5000
connect = 127.0.0.1:3128
cert = stunnel.pem
```

- 启动 stunnel

### 客户端配置

##### 1. 安装 stunnel

##### 2. 启动 stunnel 客户端

- 拷贝之前创建的证书 `stunnel.pem`
- 拷贝相同配置，更改 `client=yes`
- 启动

### 浏览器客户端配置

##### 配置 http proxy 指向上一个stunnel客户端 (如`http://127.0.0.1:5000`)


# squid + stunnel 代理 (需客户端导入stunnel证书)

不在需要通过stunnel客户端发起加密连接。（但是需要浏览器端显式导入证书）

### 服务端配置

同上，区别为 stunnel 配置中 `[sproxy]` 服务改为 `[squid]`

### 浏览器客户端配置

- 导入公钥 (`publickey.pem`重命名为`publickey.crt`导入即可)
- 配置 https proxy `https://<服务器ip>:5000`


# squid 代理配置密码验证

- 用apache工具生成密码文件 `htpasswd -c passwd.file` (安装方式: (ubuntu) `apt-get install apache2-utils`)
- 额外配置 squid

```
...
acl ncsa_users proxy_auth REQUIRED # 配置登录验证命令
...
# 配置密码验证
auth_param basic program /usr/lib/squid3/basic_ncsa_auth /etc/squid/passwd.file
auth_param basic children 5
auth_param basic realm Squid proxy-caching web server
auth_param basic credentialsttl 2 hours
auth_param basic casesensitive off
...
http_access deny !ncsa_users # 拒绝未登录请求 (写在所有其他规则之前)
http_access allow ncsa_users # 允许已登录请求
```
