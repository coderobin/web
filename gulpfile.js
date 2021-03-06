'use strict';

// generated on 2018-04-19 using generator-webapp 3.0.1
// heavily modified since

const gulp = require('gulp');
const hubRegistry = require('gulp-hub');
const gulpLoadPlugins = require('gulp-load-plugins');
const browserSync = require('browser-sync').create();
const del = require('del');
const wiredep = require('wiredep').stream;
const fs = require('fs');

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

const hub = new hubRegistry(['gulptasks/*.js']);
gulp.registry(hub);

// File where the favicon markups are stored
const FAVICON_DATA_FILE = 'faviconData.json';

let dev = true;
let snippet = '';

gulp.task('set-prod', function (done) {
  dev = false;
  snippet = JSON.parse(fs.readFileSync(FAVICON_DATA_FILE)).favicon.html_code;

  done();
})

gulp.task('styles', () => {
  return gulp.src('app/styles/*.css')
    .pipe($.if(dev, $.sourcemaps.init()))
    .pipe($.autoprefixer({ browsers: ['> 1%', 'last 2 versions', 'Firefox ESR'] }))
    .pipe($.if(dev, $.sourcemaps.write()))
    .pipe(gulp.dest('.tmp/styles'))
    .pipe(reload({ stream: true }));
});

gulp.task('scripts', () => {
  return gulp.src('app/scripts/**/*.js')
    .pipe($.plumber())
    .pipe($.if(dev, $.sourcemaps.init()))
    .pipe($.babel())
    .pipe($.if(dev, $.sourcemaps.write('.')))
    .pipe(gulp.dest('.tmp/scripts'))
    .pipe(reload({ stream: true }));
});

function lint(files) {
  return gulp.src(files)
    .pipe($.eslint({ fix: true }))
    .pipe(reload({ stream: true, once: true }))
    .pipe($.eslint.format())
    .pipe($.if(!browserSync.active, $.eslint.failAfterError()));
}

gulp.task('lint', () => {
  return lint('app/scripts/**/*.js')
    .pipe(gulp.dest('app/scripts'));
});
gulp.task('lint:test', () => {
  return lint('test/spec/**/*.js')
    .pipe(gulp.dest('test/spec'));
});

gulp.task('html', gulp.series(gulp.parallel('styles', 'scripts'), () => {
  return gulp.src('app/*.html')
    .pipe($.useref({ searchPath: ['.tmp', 'app', '.'] }))
    .pipe($.cached('userefCache'))
    .pipe($.if(/\.js$/, $.uglify({ compress: { drop_console: true } })))
    .pipe($.if(/vendor\.css$/, $.replace('fonts\/flexslider', '../fonts/flexslider')))
    .pipe($.if(/vendor\.css$/, $.replace('fonts\/Stroke-Gap-Icons', '../fonts/Stroke-Gap-Icons')))
    .pipe($.if(/\.css$/, $.cssnano({ safe: true, autoprefixer: false })))
    .pipe($.if(!dev && /\.html$/, $.realFavicon.injectFaviconMarkups(snippet)))
    .pipe($.if(/\.html$/, $.htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: { compress: { drop_console: true } },
      processConditionalComments: true,
      removeComments: true,
      removeEmptyAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true
    })))
    .pipe(gulp.dest('dist'));
}));

gulp.task('images', () => {
  return gulp.src('app/images/**/*')
    .pipe($.cache($.imagemin()))
    .pipe(gulp.dest('dist/images'));
});

gulp.task('fonts', () => {
  return gulp.src(require('main-bower-files')('**/*.{eot,svg,ttf,woff,woff2}', function (err) { })
    .concat('app/fonts/**/*'))
    .pipe($.if(dev, gulp.dest('.tmp/fonts'), gulp.dest('dist/fonts')));
});

gulp.task('extras', () => {
  return gulp.src([
    'app/favicon/*'
  ], {
      dot: true
    })
    .pipe(gulp.dest('dist/favicon'));
});

gulp.task('clean', gulp.parallel(del.bind(null, ['.tmp', 'dist']),
  (done) => { $.cache.clearAll(); done(); }));

// inject bower components
gulp.task('wiredep', (done) => {
  gulp.src('app/*.html')
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)*\.\./
    }))
    .pipe(gulp.dest('app'));
  done();
});

gulp.task('serve',
  gulp.series(gulp.parallel('clean', 'wiredep'), gulp.parallel('styles', 'scripts', 'fonts'), () => {
    browserSync.init({
      notify: false,
      port: 9000,
      server: {
        baseDir: ['.tmp', 'app'],
        routes: {
          '/bower_components': 'bower_components'
        }
      }
    });

    gulp.watch([
      'app/*.html',
      'app/images/**/*',
      '.tmp/fonts/**/*'
    ]).on('change', reload);

    gulp.watch('app/styles/**/*.css', gulp.task('styles'));
    gulp.watch('app/scripts/**/*.js', gulp.task('scripts'));
    gulp.watch('app/fonts/**/*', gulp.task('fonts'));
    gulp.watch('bower.json', gulp.parallel('wiredep', 'fonts'));
  }));

gulp.task('serve:test', gulp.series('scripts', () => {
  browserSync.init({
    notify: false,
    port: 9000,
    ui: false,
    server: {
      baseDir: 'test',
      routes: {
        '/scripts': '.tmp/scripts',
        '/bower_components': 'bower_components'
      }
    }
  });

  gulp.watch('app/scripts/**/*.js', gulp.task('scripts'));
  gulp.watch(['test/spec/**/*.js', 'test/index.html']).on('change', reload);
  gulp.watch('test/spec/**/*.js', gulp.task('lint:test'));
}));

gulp.task('build', gulp.series(gulp.parallel('lint', 'html', 'images', 'fonts', 'extras'), () => {
  return gulp.src('dist/**/*').pipe($.size({ title: 'build', gzip: true }));
}));

gulp.task('serve:dist', gulp.series('set-prod',
  gulp.parallel('clean', 'wiredep'), 'build', () => {
    browserSync.init({
      notify: false,
      port: 9000,
      server: {
        baseDir: ['dist']
      }
    });
  }));

gulp.task('default', gulp.series('set-prod', gulp.parallel('clean', 'wiredep'), 'build'));
