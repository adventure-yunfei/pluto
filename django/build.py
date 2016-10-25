#coding=utf-8
# 安装环境脚本
# 依赖: python, pip, gulp

import os

# 安装Python Packages依赖
r = os.system('pip install -r requirements.txt')

# 安装前端依赖及编译
r = r or os.chdir('static');
r = r or os.system('npm install');
r = r or os.system('gulp scss');

exit(r)
