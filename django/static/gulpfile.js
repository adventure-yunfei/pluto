var gulp = require('gulp'),
    sass = require('gulp-sass')(require('sass')),
    taskList = require('gulp-task-listing');

gulp.task('scss', function () {
    return gulp.src('./scss/**/*.scss')
        .pipe(sass({outputStyle: 'compressed'}))
        .pipe(gulp.dest('./css'));
});

gulp.task('watch-scss', gulp.series(['scss'], function () {
    return gulp.watch('./scss/**/*.scss', ['scss']);
}));

gulp.task('help', taskList.withFilters(/None/));

gulp.task('default', gulp.series(['scss']));
