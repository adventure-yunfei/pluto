var gulp = require('gulp'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    cssAutoprefixer = require('gulp-autoprefixer'),
    taskList = require('gulp-task-listing');

gulp.task('scss', function () {
    gulp.src('./scss/**/*.scss')
        .pipe(sass({outputStyle: 'compressed'}))
        .pipe(cssAutoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(gulp.dest('./css'));
});

gulp.task('watch-scss', ['scss'], function () {
    gulp.watch('./scss/**/*.scss', ['scss']);
});

gulp.task('help', taskList.withFilters(/None/));

gulp.task('default', ['scss']);
