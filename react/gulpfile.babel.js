import path from 'path';
import gulp from 'gulp';
import merge from 'merge-stream';
import babel from 'gulp-babel';
import gulpUtil from 'gulp-util';
import bg from 'gulp-bg';
import webpack from 'webpack';
import yargs from 'yargs';
import rimraf from 'rimraf';
import eslint from 'gulp-eslint';
import runSequence from 'run-sequence';
import {dependencySizeTree, printDependencySizeTree} from 'webpack-bundle-size-analyzer';
import taskList from 'gulp-task-listing';

import makeWebpackConfig from './makeWebpackConfig';
import {BUILD_DIR} from './constants';

const args = yargs
    .alias('p', 'production')
    .alias('t', 'test')
    .alias('a', 'analyze')
    .argv;
const isDev = !args.production; // Debug mode, will produce uncompressed debug bundle, and watch src file changes
const isTest = !!args.test; // Test mode, will enable code with condition "__TEST__"

/////////////////////////////////////
// task for code style
gulp.task('eslint', () => {
    return gulp.src(['**/*.js', '!node_modules/**', `!${BUILD_DIR}/**`])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('env', () => {
    /*eslint-env node */
    process.env.NODE_ENV = isDev ? 'development' : 'production';
    process.env.UV_THREADPOOL_SIZE = 100;
});

/////////////////////////////////////
// tasks to produce one bundled file
gulp.task('clean', () => {
    rimraf.sync(`${BUILD_DIR}/*`);
});
gulp.task('build', ['clean'], (done) => {
    webpack(makeWebpackConfig(isDev, isTest), (err, stats) => {
        var jsonStats = stats.toJson();
        var buildError = err || jsonStats.errors[0] || jsonStats.warnings[0];

        if (buildError) {
            if (isDev) {
                gulpUtil.log('[webpack]', 'Fatal build error: \n' + buildError);
            } else {
                throw new gulpUtil.PluginError('webpack', buildError);
            }
        } else {
            if (isDev) {
                gulpUtil.log('[webpack]', 'Bundles built successfully on debug mode');
            } else {
                gulpUtil.log('[webpack]', stats.toString({
                    colors: true,
                    version: false,
                    hash: false,
                    timings: false,
                    chunks: false,
                    chunkModules: false
                }));
            }

            // On Development mode webpack is configured to keep watching, so we don't finish the task;
            // On Production mode do only once compilation instead
            if (isDev) {
                gulpUtil.log('Continue to watch file changes...');
            } else {
                if (args.analyze) {
                    dependencySizeTree(jsonStats).forEach(tree => {
                        printDependencySizeTree(tree);
                    });
                }
                done();
            }
        }
    });
});

gulp.task('build-server', function () {
    rimraf.sync(path.resolve(__dirname, 'server-build'));
    return merge([
        gulp.src('./app/**/*.js', {base: './app'})
            .pipe(babel())
            .pipe(gulp.dest('server-build')),
        gulp.src(['./app/**/*', '!./app/**/*.js'], {base: './app'})
            .pipe(gulp.dest('server-build'))
    ]);
});

gulp.task('server', ['env'], function (done) {
    if (isDev) {
        bg('node', 'app/server/index.js')();
    } else {
        require('./prod_server_script').start_server(done);
    }
});
gulp.task('stop-server', done => {
    require('./prod_server_script').stop_server(done);
});

gulp.task('help', taskList.withFilters(/None/, /env/));

gulp.task('default', function (done) {
    if (isDev) {
        runSequence('server', done);
    } else {
        runSequence('build', 'server', done);
    }
});
