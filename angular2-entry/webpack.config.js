var path = require('path'),
    HtmlWebpackPlugin = require('html-webpack-plugin'),
    ROOT_DIR = __dirname,
    APP_DIR = path.resolve(__dirname, 'app');

function _appPath(relativePath) {
    return path.resolve(APP_DIR, relativePath);
}

function makeStyleLoader (preCssLoader) {
    preCssLoader = preCssLoader ? ('!' + preCssLoader) : '';
    return 'style!css' + preCssLoader;
}

module.exports = {
    entry: {
        app: _appPath('main.ts')
    },
    output: {
        filename: '[name].js',
        path: 'build',
        publicPath: '/static'
    },
    resolve: {
        extensions: ['', '.ts', '.js']
    },
    module: {
        loaders: [
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
                test: /\.html$/i,
                loader: 'html'
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(ROOT_DIR, 'index.html')
        })
    ]
};
