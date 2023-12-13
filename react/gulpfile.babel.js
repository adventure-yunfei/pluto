import gulp from 'gulp';
import gulpUtil from 'gulp-util';
import bg from 'gulp-bg';
import babel from 'gulp-babel';
import webpack from 'webpack';
import yargs from 'yargs';
import rimraf from 'rimraf';
import pm2 from 'pm2';
import taskList from 'gulp-task-listing';

import makeWebpackConfig from './makeWebpackConfig';
import {BUILD_DIR, BUILD_SERVER_DIR} from './constants';

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

gulp.task('build-server', () => {
    rimraf.sync(`${BUILD_SERVER_DIR}/*`);
    return gulp.src(['./app/server/**/*.js', './app/lib/**/*.js', '!node_modules/**'], { base: '.' })
        .pipe(babel())
        .pipe(gulp.dest(BUILD_SERVER_DIR));
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

const ServerScript = 'build-server/app/server/index.js';
const ServerPM2Name = 'pluto';
gulp.task('server', gulp.series(['env'], function (done) {
    // if (isDev) {
    //     bg('node', 'app/server/index.js')();
    // } else {
    pm2.connect(err => {
        if (err) {
            gulpUtil.log('[pm2]', 'start pm2 failed:');
            gulpUtil.log('[pm2]', err);
            done();
        } else {
            pm2.start({
                script: ServerScript,
                name: ServerPM2Name
            }, () => {
                pm2.disconnect();
                done();
            });
        }
    });
    // }
}));
gulp.task('stop-server', done => {
    pm2.connect(err => {
        if (err) {
            gulpUtil.log('[pm2]', 'start pm2 failed:');
            gulpUtil.log('[pm2]', err);
            done();
        } else {
            pm2.stop(ServerPM2Name, () => {
                pm2.disconnect();
                done();
            });
        }
    });
});

gulp.task('help', taskList.withFilters(/None/, /env/));

gulp.task('default', gulp.series(isDev ? ['server'] : ['build', 'server']));
