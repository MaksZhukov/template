let gulp = require('gulp'),
  gulpif = require('gulp-if'),
  sass = require('gulp-sass'),
  sourcemaps = require('gulp-sourcemaps'),
  cssImport = require('gulp-cssimport'),
  cleanCSS = require('gulp-clean-css'),
  browserSync = require('browser-sync'),
  pug = require('gulp-pug'),
  htmlreplace = require('gulp-html-replace'),
  replace = require('gulp-replace'),
  plumber = require('gulp-plumber'),
  emitty = require('emitty').setup('src', 'pug', {
    makeVinylFile: true,
    basedir: 'src/pug'
  }),
  concat = require('gulp-concat'),
  uglify = require('gulp-uglify-es').default,
  rename = require('gulp-rename'),
  del = require('del'),
  imagemin = require('gulp-tinypng-nokey'),
  autoprefixer = require('gulp-autoprefixer'),
  task = process.argv.slice(2, 3)[0],
  folder;

global.emittyChangedFile = 'src/pug/index.pug';

switch (task) {
    case 'prod':
        folder = 'dist';
        break;
    case 'dev':
        folder = 'src';
        break;
    case 'wp':
        folder = '../assets';
        break;
    default:
        break;
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
    arrScripts = [
        'src/libs/jquery/dist/jquery.min.js',
        'src/js/common.js' // Всегда в конце
    ];
    switch (task) {
        case 'wp':
            return gulp.src('src/js/common.js')
                .pipe(rename({ basename: 'scripts' }))
                .pipe(gulp.dest(`${folder}/js`));
        case 'prod':
            return gulp.src(arrScripts)
              .pipe(concat('scripts.js'))
              .pipe(gulp.dest(folder + '/js'))
              .pipe(rename({
                suffix: '.min'
              }))
              .pipe(uglify())
              .pipe(gulp.dest(folder + '/js'));
        case 'dev':
            return gulp.src(arrScripts)
              .pipe(concat('scripts.js'))
              .pipe(gulp.dest(folder + '/js'))
              .pipe(browserSync.reload({
                stream: true
              }));
        default:
            break;
    }
});
gulp.task('pug', function () {
  return gulp
    .src('src/pug/*.pug')
    .pipe(plumber())
    .pipe(gulpif(global.watch, emitty.stream(global.emittyChangedFile, global.emittyChangedFileStatus)))
    .pipe(pug({
      pretty: true
    }))
    .pipe(
      gulpif(
        task === 'prod',
        htmlreplace({
          css: 'css/style.min.css',
          js: 'js/scripts.min.js'
        })
      )
    )
    .pipe(gulp.dest(folder))
    .pipe(gulpif(task === 'dev', browserSync.reload({
      stream: true
    })));
});
gulp.task('sass', function () {
    switch (task) {
        case 'prod':
            return gulp
                .src('src/sass/**/*.sass')
                .pipe(sass({
                  outputStyle: 'expanded'
                }).on('error', sass.logError))
                .pipe(autoprefixer(['last 5 versions']))
                .pipe(cssImport())
                .pipe(gulp.dest(folder + '/css'))
                .pipe(rename({
                  suffix: '.min'
                }))
                .pipe(cleanCSS())
                .pipe(gulp.dest(folder + '/css'))
        case 'dev':
            return gulp
                .src('src/sass/**/*.sass')
                .pipe(sourcemaps.init())
                .pipe(sass({
                  outputStyle: 'expanded'
                }).on('error', sass.logError))
                .pipe(autoprefixer(['last 5 versions']))
                .pipe(gulpif(task === 'dev', sourcemaps.write()))
                .pipe(gulp.dest(folder + '/css'))
                .pipe(browserSync.reload({
                  stream: true
                }));
        case 'wp':
            return gulp
                .src('src/sass/**/*.sass')
                .pipe(sass({
                  outputStyle: 'expanded'
                }).on('error', sass.logError))
                .pipe(autoprefixer(['last 5 versions']))
                .pipe(cssImport())
                .pipe(replace('..','.'))
                .pipe(gulp.dest('../'))
        default:
            break;
    }
  return gulp
    .src('src/sass/**/*.sass')
    .pipe(gulpif(task === 'dev', sourcemaps.init()))
    .pipe(sass({
      outputStyle: 'expanded'
    }).on('error', sass.logError))
    .pipe(autoprefixer(['last 5 versions']))
    .pipe(gulpif(task === 'prod', cssImport()))
    .pipe(gulpif(task === 'dev', sourcemaps.write()))
    .pipe(gulp.dest(folder + '/css'))
    .pipe(gulpif(task === 'prod', rename({
      suffix: '.min'
    })))
    .pipe(gulpif(task === 'prod', cleanCSS()))
    .pipe(gulpif(task === 'prod', gulp.dest(folder + '/css')))
    .pipe(gulpif(task === 'dev', browserSync.reload({
      stream: true
    })));
});

gulp.task(
  'watch',
  gulp.parallel('pug', 'sass', 'js', 'browser-sync', function () {
    global.watch = true;
    gulp.watch('src/sass/**/*.sass', gulp.series('sass'));
    gulp.watch(['src/libs/**/*.js', 'src/js/common.js'], gulp.series('js'));
    gulp
      .watch('src/pug/**/*.pug', gulp.series('pug'))
      .on('all', function (event, filepath, status) {
        global.emittyChangedFile = filepath;
        global.emittyChangedFileStatus = status;
      });
  })
);

gulp.task('images', function () {
  return gulp
    .src('src/images/**/*')
    .pipe(imagemin())
    .pipe(gulp.dest(folder + '/images'));
});

gulp.task('fonts', function () {
  return gulp.src(['src/fonts/**/*']).pipe(gulp.dest(`${folder}/fonts`));
});

gulp.task('libs', function () {
    console.log(folder);
  return gulp.src(['src/libs/**/*']).pipe(gulp.dest(`${folder}/libs`));
});

gulp.task('php', function () {
  return gulp.src(['src/**/*.php']).pipe(gulp.dest('dist'));
});

gulp.task('htaccess', function () {
  return gulp.src(['src/.htaccess']).pipe(gulp.dest('dist'));
});

gulp.task('removedist', function (done) {
  del.sync('dist');
  done();
});

gulp.task(
  'prod',
  gulp.parallel('removedist', 'pug', 'sass', 'js', 'images', 'fonts', 'libs')
);

gulp.task('dev', gulp.series('watch'));

gulp.task('wp', gulp.parallel('libs', 'fonts', 'images', 'js', 'sass'));