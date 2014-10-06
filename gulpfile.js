var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var del = require('del');

var mainBowerFiles = require('main-bower-files');
var files = mainBowerFiles(/* options */);

gulp.task('build-js', function() {
  return gulp.src(mainBowerFiles({filter: new RegExp('.js$')}))
    .pipe(uglify())
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest('public/scripts'));
});
gulp.task('build-css', function() {
  console.log(mainBowerFiles({filter: new RegExp('.css$')}));
  return gulp.src(mainBowerFiles({filter: new RegExp('.css$')}))
    .pipe(concat('vendor.css'))
    .pipe(gulp.dest('public/styles'));
});

gulp.task('default', ['build-js', 'build-css']);
