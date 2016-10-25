var gulp = require('gulp');
var sass = require('gulp-sass');
var merge = require('merge-stream');
var react = require('gulp-react');
var sourcemaps = require("gulp-sourcemaps");

var projects = ['blog'];

gulp.task('scss', function () {
    return merge(projects.map(function (projName) {
        return gulp.src(projName + '/scss')
            .pipe(sourcemaps.init())
            .pipe(sass().on('error', sass.logError))
            .pipe(sourcemaps.write())
            .pipe(gulp.dest(projName + '/css'));
    }));
});

gulp.task('react-jsx', function () {
    return merge(projects.map(function (proj) {
        return gulp.src(proj + '/jsx/*.js')
            .pipe(sourcemaps.init())
            .pipe(react())
            .pipe(sourcemaps.write())
            .pipe(gulp.dest(proj + '/js/jsx/'));
    }));
});

gulp.task('all', ['scss', 'react-jsx'], function() {});

gulp.task('watch', function () {
    return gulp.watch('./', ['all']);
});

gulp.task('default', ['watch']);