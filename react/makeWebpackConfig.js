/*eslint-env node */
import path from 'path';
import webpack from 'webpack';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import {ROOT, APP_SRC_DIR, BUILD_DIR} from './constants';
import autoprefixer from 'autoprefixer';

const BABEL_POLYFILL = require.resolve('babel-core/polyfill');

export default function makeWebpackConfig(isDev, isTest = false) {
    const getStyleLoader = (preCssLoader = '') => {
        preCssLoader = preCssLoader && `!${preCssLoader}`;
        return isDev ? `style-loader!css-loader!${preCssLoader}`
            : ExtractTextPlugin.extract('style-loader', `css-loader!${preCssLoader}`);
    };
    const styleLoaders = [{
        // postcss 添加前缀功能忽略外部库样式文件
        exclude: [/node_modules|plugins/],
        test: /\.css$/,
        loader: getStyleLoader('postcss-loader')
    }, {
        include: [/node_modules|plugins/],
        test: [/\.css/],
        loader: getStyleLoader('')
    }, {
        test: /\.s(a|c)ss$/,
        loader: getStyleLoader('postcss-loader!sass-loader')
    }];

    return {
        context: ROOT,
        entry: {
            main: [
                ...(isDev ? ['webpack-hot-middleware/client'] : []),
                BABEL_POLYFILL,
                path.join(APP_SRC_DIR, 'client', 'main.js')
            ]
        },
        debug: isDev,
        devtool: isDev ? 'cheap-module-source-map' : '',
        watch: isDev,
        output: {
            path: BUILD_DIR,
            filename: '[name].js',
            //sourceMapFilename: '[file].[hash].map', // include this config if meeting problem that source map is cached on browser
            publicPath: '/build/'
        },
        module: {
            loaders: [{
                exclude: [/node_modules/],
                test: /\.js$/,
                loader: 'babel',
                //loaders: ['babel', `js-assert/webpack-assert-loader?dev=${isDev ? 'true' : 'false'}`] // TODO: add js-assert loader
                query: isDev ? {
                    plugins: [
                        'react-transform'
                    ],
                    extra: {
                        'react-transform': {
                            'transforms': [{
                                transform: 'react-transform-hmr',
                                imports: ['react'],
                                locals: ['module']
                            }]
                        }
                    }
                } : {}
            }, {
                test: /\.json/,
                loader: 'json-loader'
            }, {
                test: /\.(gif|jpg|png|woff|woff2|eot|ttf|svg)(\?v=.+)?$/,
                loader: 'url?limit=10000&name=[path][name].[ext]?[sha256:hash:base64:8]' // embed img data if less than 10kb
            }, ...styleLoaders]
        },
        postcss: function () {
            return [autoprefixer];
        },
        plugins: [
            // Define a "__DEV__" variable to add code only for debug mode
            // e.g. __DEV__ && someDebugOnlyCheck();
            new webpack.DefinePlugin({
                '__DEV__': isDev,
                '__TEST__': isTest
            }),
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': isDev ? '"development"' : '"production"'
            })
        ].concat(isDev ? [
            new webpack.optimize.OccurenceOrderPlugin(),
            new webpack.HotModuleReplacementPlugin(),
            new webpack.NoErrorsPlugin()
        ] : [
            new ExtractTextPlugin('[name].css'),
            new webpack.optimize.DedupePlugin(),
            new webpack.optimize.OccurenceOrderPlugin(),
            new webpack.optimize.UglifyJsPlugin({
                compress: {
                    warnings: false,
                    /* eslint camelcase: 0*/
                    screw_ie8: true
                }
            })
        ])
    };
}
