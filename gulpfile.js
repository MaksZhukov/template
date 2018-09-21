let gulp = require('gulp'),
  gulpif = require('gulp-if'),
  sass = require('gulp-sass'),
  sourcemaps = require('gulp-sourcemaps'),
  cssImport = require('gulp-cssimport'),
  cleanCSS = require('gulp-clean-css'),
  browserSync = require('browser-sync'),
  pug = require('gulp-pug'),
  htmlreplace = require('gulp-html-replace'),
  plumber = require('gulp-plumber'),
  emitty = require('emitty').setup('app', 'pug', {
    makeVinylFile: true,
    basedir: 'app/pug'
  }),
  concat = require('gulp-concat'),
  uglify = require('gulp-uglify-es').default,
  rename = require('gulp-rename'),
  del = require('del'),
  imagemin = require('gulp-tinypng-nokey'),
  autoprefixer = require('gulp-autoprefixer'),
  status = {
    prod: process.argv.slice(2, 3)[0] === 'prod',
    dev: process.argv.slice(2, 3)[0] === 'dev'
  },
  folder;

global.emittyChangedFile = 'app/pug/index.pug';

if (status.prod) {
  folder = 'dist';
} else {
  folder = 'app';
}

gulp.task('browser-sync', function () {
  browserSync({
    server: {
      baseDir: folder
    },
    notify: false
  });
});

gulp.task('js', function () {
  return gulp
    .src([
      'app/libs/jquery/dist/jquery.min.js',
      'app/js/common.js' // Всегда в конце
    ])
    .pipe(concat('scripts.js'))
    .pipe(gulp.dest(folder + '/js'))
    .pipe(gulpif(status.prod, rename({
      suffix: '.min'
    })))
    .pipe(gulpif(status.prod, uglify()))
    .pipe(gulpif(status.prod, gulp.dest(folder + '/js')))
    .pipe(gulpif(status.dev, browserSync.reload({
      stream: true
    })));
});
gulp.task('pug', function () {
  return gulp
    .src('app/pug/*.pug')
    .pipe(plumber())
    .pipe(gulpif(global.watch, emitty.stream(global.emittyChangedFile, global.emittyChangedFileStatus)))
    .pipe(pug({
      pretty: true
    }))
    .pipe(
      gulpif(
        status.prod,
        htmlreplace({
          css: 'css/style.min.css',
          js: 'js/scripts.min.js'
        })
      )
    )
    .pipe(gulp.dest(folder))
    .pipe(gulpif(status.dev, browserSync.reload({
      stream: true
    })));
});
gulp.task('sass', function () {
  return gulp
    .src('app/sass/**/*.sass')
    .pipe(gulpif(status.dev, sourcemaps.init()))
    .pipe(sass({
      outputStyle: 'expanded'
    }).on('error', sass.logError))
    .pipe(autoprefixer(['last 5 versions']))
    .pipe(gulpif(status.prod, cssImport()))
    .pipe(gulpif(status.dev, sourcemaps.write()))
    .pipe(gulp.dest(folder + '/css'))
    .pipe(gulpif(status.prod, rename({
      suffix: '.min'
    })))
    .pipe(gulpif(status.prod, cleanCSS()))
    .pipe(gulpif(status.prod, gulp.dest(folder + '/css')))
    .pipe(gulpif(status.dev, browserSync.reload({
      stream: true
    })));
});

gulp.task(
  'watch',
  gulp.parallel('pug', 'sass', 'js', 'browser-sync', function () {
    global.watch = true;
    gulp.watch('app/sass/**/*.sass', gulp.series('sass'));
    gulp.watch(['app/libs/**/*.js', 'app/js/common.js'], gulp.series('js'));
    gulp
      .watch('app/pug/**/*.pug', gulp.series('pug'))
      .on('all', function (event, filepath, status) {
        global.emittyChangedFile = filepath;
        global.emittyChangedFileStatus = status;
      });
  })
);

gulp.task('image', function () {
  return gulp
    .src('app/img/**/*')
    .pipe(imagemin())
    .pipe(gulp.dest(folder + '/img'));
});

gulp.task('fonts', function () {
  return gulp.src(['app/fonts/**/*']).pipe(gulp.dest('dist/fonts'));
});

gulp.task('libs', function () {
  return gulp.src(['app/libs/**/*']).pipe(gulp.dest('dist/libs'));
});

gulp.task('php', function () {
  return gulp.src(['app/**/*.php']).pipe(gulp.dest('dist'));
});

gulp.task('htaccess', function () {
  return gulp.src(['app/.htaccess']).pipe(gulp.dest('dist'));
});

gulp.task('removedist', function (done) {
  del.sync('dist');
  done();
});

gulp.task(
  'prod',
  gulp.parallel('removedist', 'pug', 'sass', 'js', 'image', 'fonts', 'libs')
);

gulp.task('dev', gulp.series('watch'));