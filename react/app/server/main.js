import express from 'express';
import request from 'request';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
// import webapckHotMiddleware from 'webpack-hot-middleware';
import compression from 'compression';

import '../lib/polyfill';

import render from './render';
import makeWebpackConfig from '../../makeWebpackConfig';
import config from './config';

function createProxy(toUrl, {nocache = false}) {
    const proxy = express();

    proxy.use((req, res) => {
        const url = toUrl + req.url;

        req.pipe(request(url).on('error', (e) => {
            console.log('### Backend Server Error:'); // eslint-disable-line no-console
            console.log(e); // eslint-disable-line no-console
            res.status(500).send(e);
        }))
            .pipe(res);

        if (nocache) {
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '-1');
        }
    });

    return proxy;
}


const app = express();

// gzip压缩请求
app.use(compression());

// config webpack for hot reloading
// Since EventSource is not supported in IE, debugging on IE is not supported.
if (__DEV__) {
    const webpackConfig = makeWebpackConfig(true, true);
    const compiler = webpack(webpackConfig);
    app.use(webpackDevMiddleware(compiler, {
        // noInfo: true,
        publicPath: webpackConfig.output.publicPath
    }));

    // app.use(webapckHotMiddleware(compiler));
}

app.use('/api', createProxy(config.apiServer, {nocache: true}));

app.use('/build', express.static('build'));
app.use('/static', express.static('static'));
app.use('/game2048', (req, res, next) => render(req, res, next, {checkLogin: false}));
app.get('*', render);

app.listen(config.port, '127.0.0.1', function () {
    console.log('server started for ' + config.port); // eslint-disable-line no-console
});
