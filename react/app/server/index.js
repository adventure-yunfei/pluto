/*eslint-env node */
// 在服务器端添加全局 __DEV__ 变量
global.__DEV__ = process.env.NODE_ENV === 'development';
global.__TEST__ = false;

if (__DEV__) {
    require('@babel/register');
}

// 在服务器端忽略js以外的文件加载
['.scss', '.css'].forEach((extension) => require.extensions[extension] = function () {});

require('./main');
