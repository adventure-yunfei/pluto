var path = require('path');

exports.config = Object.assign(
    {},
    require('web-auto-test').config,
    {
        specs: [
            './game2048/*.test.js' // 路径相对于脚本执行时的当前目录
        ]
    }
);
