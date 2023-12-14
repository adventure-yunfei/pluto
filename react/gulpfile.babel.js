import gulp from 'gulp';
import gulpUtil from 'gulp-util';
import bg from 'gulp-bg';
import babel from 'gulp-babel';
import webpack from 'webpack';
import yargs from 'yargs';
import rimraf from 'rimraf';
import fse from 'fs-extra';
import taskList from 'gulp-task-listing';
import * as path from 'path';

import makeWebpackConfig from './makeWebpackConfig';
import {BUILD_DIR, BUILD_SERVER_DIR, ROOT} from './constants';

const args = yargs
    .alias('p', 'production')
    .alias('t', 'test')
    .argv;
const isDev = !args.production; // Debug mode, will produce uncompressed debug bundle, and watch src file changes
const isTest = !!args.test; // Test mode, will enable code with condition "__TEST__"

gulp.task('env', (done) => {
    /*eslint-env node */
    process.env.NODE_ENV = isDev ? 'development' : 'production';
    process.env.UV_THREADPOOL_SIZE = 100;
    done();
});

/////////////////////////////////////
// tasks to produce one bundled file
gulp.task('clean', (done) => {
    rimraf.sync(`${BUILD_DIR}/*`);
    done();
});

gulp.task('build', gulp.series(['clean'], (done) => {
    webpack(makeWebpackConfig(isDev, isTest), (err, stats) => {
        var jsonStats = stats.toJson();
        var buildError = err || jsonStats.errors[0];

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
                done();
            }
        }
    });
}));

gulp.task('server', gulp.series(['env'], function (done) {
    if (isDev) {
        bg('node', 'app/server/index.js')();
    } else {
        throw new Error(`This gulp task is only for DEV server`);
    }
}));

gulp.task('build-server', gulp.series([() => {
    fse.emptyDirSync(BUILD_SERVER_DIR);
    fse.outputJsonSync(path.resolve(BUILD_SERVER_DIR, 'pm2-process.json'), {
        apps: [{
            name: 'photo',
            script: 'server/index.js',
        }]
    });
    return gulp.src(['./app/**', '!app/**/*.js'], { base: './app' })
        .pipe(gulp.dest(BUILD_SERVER_DIR));
}, () => {
    return gulp.src(['./app/**/*.js'], { base: './app' })
        .pipe(babel())
        .pipe(gulp.dest(BUILD_SERVER_DIR));
}]));

gulp.task('help', taskList.withFilters(/None/, /env/));

gulp.task('default', gulp.series(isDev ? ['server'] : ['build', 'server']));
