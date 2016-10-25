import React from 'react';
import Component from 'react-pure-render/component';

import packageJson from '../../../../../package.json';

export default class About extends Component {
    render() {
        return (
            <div style={{lineHeight: 2}}>
                <p>作者：Yunfei</p>
                <p>版本：{packageJson.version}</p>
                <p>后端语言：Python 2.7.2</p>
                <p>后端框架：Django 1.8.0</p>
                <p>前端语言：Javascript ES6</p>
                <p>前端框架：React + Redux + React-Router</p>
                <p>依赖打包：Webpack</p>
                <p>服务器：阿里云</p>
            </div>
        );
    }
}
