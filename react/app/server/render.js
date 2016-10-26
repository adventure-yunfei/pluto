import React from 'react';
import {renderToString} from 'react-dom/server';
import {match, RouterContext} from 'react-router';
import {Provider} from 'react-redux';
import request from 'request';
import merge from 'lodash/merge';

import {request as promiseRequest} from '../lib/request';
import createRoutes from '../client/createRoutes';
import configureStore from '../client/configureStore';
import EnumErrorCodes from '../client/photo/enums/EnumErrorCodes';
import config from './config';
import globalConfig from '../../../config.json';

function asyncInitStore(req, res, {checkLogin = true} = {}) {
    return new Promise((resolve, reject) => {
        if (checkLogin) {
            const initialState = {};
            request({
                url: config.apiServer + '/get_user',
                json: true,
                headers: {
                    cookie: req.headers.cookie
                }
            }, (err, response, data) => {
                if (!err) {
                    // 传递cookie
                    const resCookie = response.headers['set-cookie'];
                    resCookie && res.setHeader('set-cookie', resCookie);

                    initialState.user = {
                        isLoggedIn: response.statusCode === 200 && data && !data.e,
                        username: data.username
                    };
                } else {
                    initialState.user = {
                        isLoggedIn: false
                    };
                }

                resolve(initialState);
            });
        } else {
            resolve({});
        }
    }).then((initialState) => configureStore(initialState));
}

function getPageHtml(appContentHtml, state = {}) {
    return '<!DOCTYPE html>' +
        '<html>' +
        '<head>' +
            // global-menu 样式
            `<link type="text/css" rel="stylesheet" href="http://${globalConfig.hosts.static.by_domain}/dist/global-menu/global-menu.css"/>` +
            (!__DEV__ ? '<link type="text/css" rel="stylesheet" href="/build/main.css"/>' : '') +
// 百度统计代码
`<script>
var _hmt = _hmt || [];
(function() {
  var baiduAnalytics = "${globalConfig["react-photosite"]["baiduAnalytics"] || ""}";
  if (!baiduAnalytics) {
    console.error("百度统计配置未添加.");
    return;
  }
  var hm = document.createElement("script");
  hm.src = "//hm.baidu.com/hm.js?" + baiduAnalytics;
  var s = document.getElementsByTagName("script")[0];
  s.parentNode.insertBefore(hm, s);
})();
</script>
` +
        '</head>' +
        '<body>' +
            // global-menu显示/隐藏开关
            '<div class="global-menu-toggler"></div>' +
            '<div id="app">' + appContentHtml + '</div>' +
            '<script>window.__INITIAL_STATE__ = ' + JSON.stringify(state) + ';</script>' +
            // global-menu 加载
            `<script type="text/javascript" src="http://${globalConfig.hosts.static.by_domain}/dist/global-menu/global-menu.js"></script>` +
            '<script src="/build/main.js"></script>' +
        '</body>' +
        '</html>';
}

// 获取所有Route组件定义的初始化数据
function fetchInitialData(req, res, store, renderProps) {
    const serverRequest = (reqCfg) => promiseRequest(merge({}, reqCfg, {
        url: reqCfg.url.startsWith('http') ? reqCfg.url : `${req.protocol}://localhost:${config.port}${reqCfg.url}`,
        headers: {
            cookie: req.headers.cookie || ''
        }
    }));
    const fetchDataActions = renderProps.components.reduce((result, comp) => result.concat(comp && comp.fetchDataActions || []), []);
    const promises = fetchDataActions.map(actionCreator => store.dispatch(actionCreator({
        request: serverRequest,
        location: renderProps.location,
        params: renderProps.params
    })));
    return Promise.all(promises);
}

export default function render(req, res, next, {checkLogin = true} = {}) {
    const catchError = err => {
        console.log('### Server Error:'); // eslint-disable-line no-console
        console.log(err); // eslint-disable-line no-console
        res.status(500).send(err);
    };
    asyncInitStore(req, res, {checkLogin})
        .then((store) => {
            const routes = createRoutes(store.getState);
            match({routes, location: req.originalUrl}, (error, redirectLocation, renderProps) => {
                if (error) {
                    res.status(500).send(error.message);
                } else if (redirectLocation) {
                    res.redirect(302, redirectLocation.pathname + redirectLocation.search);
                } else if (renderProps) {
                    // You can also check renderProps.components or renderProps.routes for
                    // your "not found" component or route respectively, and send a 404 as
                    // below, if you're using a catch-all route.
                    const sendResponse = () => {
                        res.status(200).send(getPageHtml(renderToString((
                            <Provider store={store}>
                                <RouterContext {...renderProps} />
                            </Provider>
                        )), store.getState()));
                    };
                    fetchInitialData(req, res, store, renderProps)
                        .then(sendResponse, res => {
                            if (res.data.e === EnumErrorCodes.NotLogin) {
                                // 未登录下client会跳转到登录页
                                sendResponse();
                            } else {
                                catchError(res);
                            }
                        })
                        .catch(catchError);
                } else {
                    res.status(404).send('Not found');
                }
            });
        }).catch(catchError);
}
