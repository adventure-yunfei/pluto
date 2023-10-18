/*eslint-env node */
import path from 'path';
import webpack from 'webpack';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import {ROOT, APP_SRC_DIR, BUILD_DIR} from './constants';

export default function makeWebpackConfig(isDev, isTest = false) {
    const getStyleLoaders = (preCssLoader = undefined) => {
        return [
            isDev ? 'style-loader': MiniCssExtractPlugin.loader,
            'css-loader',
            ...(preCssLoader ? [preCssLoader] : []),
        ];
    };

    return {
        context: ROOT,
        entry: {
            main: path.join(APP_SRC_DIR, 'client', 'main.js'),
        },
        mode: isDev ? 'development' : 'production',
        output: {
            path: BUILD_DIR,
            filename: '[name].js',
            //sourceMapFilename: '[file].[hash].map', // include this config if meeting problem that source map is cached on browser
            publicPath: '/build/'
        },
        module: {
            rules: [{
                exclude: [/node_modules/],
                test: /\.js$/,
                use: "babel-loader",
            }, {
                test: /\.(gif|jpg|png|woff|woff2|eot|ttf|svg)(\?v=.+)?$/,
                use: {
                    loader: 'url-loader',
                    options: {
                        limit: 10000,
                    },
                }
            }, {
                include: [/node_modules|plugins/],
                test: [/\.css/],
                use: getStyleLoaders(undefined)
            }, {
                test: /\.s(a|c)ss$/,
                use: getStyleLoaders('sass-loader')
            }]
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
        ].concat(isDev ? [] : [new MiniCssExtractPlugin({ filename: "[name].css" })]),
    };
}
