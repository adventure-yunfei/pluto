# Steps for Pluto to Take Off

#### 1. 安装环境

- Nginx
- Python 2.7
- pip
- uwsgi 2
- Node 4+
- npm 2~3
- gulp
- 如有必要, [配置 npm registry 镜像](https://github.com/adventure-yunfei/easy-git-npm-tools.git)

最后, 在工程根目录下安装npm包: `npm install`, 以启用必要的编译脚本执行环境。

#### 2. 配置 Nginx

- 生成配置文件: `node build nginx-config --output pluto-nginx.conf`
- 以你想用的任何方式把这个配置文件引入到 Nginx 配置中

#### 3. 编译 & 启动服务器

- `node build run`
