var path = require('path'),
    webpack = require('webpack'),
    HtmlWebpackPlugin = require('html-webpack-plugin'),
    ExtractTextPlugin = require('extract-text-webpack-plugin'),
    globalConfig = require('../config.json'),
    ROOT_DIR = __dirname,
    isDev = process.env.DEV !== 'false';

function makeStyleLoader (preCssLoader) {
    preCssLoader = preCssLoader ? ('!' + preCssLoader) : '';
    return isDev ? 'style!css' + preCssLoader : ExtractTextPlugin.extract('style', 'css' + preCssLoader);
}

function makeFilename(filename) {
    if (filename.indexOf('[name]') > -1 && !isDev) {
        return filename.replace('[name]', '[name].[hash:6]')
    } else {
        return filename;
    }
}

module.exports = {
    entry: {
        index: path.resolve(ROOT_DIR, 'index.ts')
    },
    output: {
        filename: makeFilename('static/[name].js'),
        path: path.resolve(ROOT_DIR, 'build/'),
        publicPath: isDev ? path.resolve(ROOT_DIR, 'build') + '/' : '/'
    },
    resolve: {
        extensions: ['', '.ts', '.js']
    },
    module: {
        loaders: [
            {
                test: /\Wzepto\W.*\.js$/,
                loader: 'imports?this=>window'
            },
            {
                test: /\.ts$/,
                loader: 'ts'
            },
            {
                test: /\.less$/i,
                loader: makeStyleLoader('less')
            },
            {
                test: /\.css$/i,
                loader: makeStyleLoader()
            },
            {
                test: /\.(jpeg|png|jpg)$/i,
                loader: 'url?limit=10000&name=' + makeFilename('static/[path][name].[ext]')
            },
            {
                test: /\.(eot|woff2|woff|ttf)$/i,
                loader: 'file-loader?name=' + (isDev ? 'static/[path][name].[ext]' : 'static/fonts/[name].[hash:6].[ext]')
            }
        ]
    },
    plugins: (isDev ? [] : [
        new ExtractTextPlugin(makeFilename('static/[name].css')),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false,
                /* eslint camelcase: 0*/
                screw_ie8: true
            }
        })
    ]).concat([
        new HtmlWebpackPlugin({
            template: path.resolve(ROOT_DIR, 'index.html'),
            hosts: globalConfig.hosts
        })
    ])
};
