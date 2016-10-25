var gulp = require('gulp'),
    sass = require('gulp-sass'),
    replace = require('gulp-replace'),
    rename = require('gulp-rename'),
    cssAutoprefixer = require('gulp-autoprefixer'),
    globalConfig = require('../config.json');

gulp.task('scss', function () {
    gulp.src(['./**/*.scss', '!node_modules/**'])
        .pipe(sass({outputStyle: 'compressed'}))
        .pipe(cssAutoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(gulp.dest('./dist'));
});

gulp.task('watch-scss', ['scss'], function () {
    gulp.watch(['./**/*.scss', '!node_modules/**'], ['scss']);
});

gulp.task('append-config-to-global-menu', function () {
    gulp.src('global-menu/global-menu.js')
        .pipe(replace('/*globalConfig_placeholder*/', 'var globalConfig = ' + JSON.stringify(globalConfig) + ';'))
        .pipe(rename('global-menu/global-menu.js'))
        .pipe(gulp.dest('./dist'));
});

gulp.task('default', ['scss', 'append-config-to-global-menu']);
