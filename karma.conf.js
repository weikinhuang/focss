/* eslint-env node */
// Karma configuration
// Generated on Tue Jan 27 2015 12:55:07 GMT-0500 (EST)
module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jquery-2.1.0', 'jasmine'],


    // list of files / patterns to load in the browser
    files: [
      'node_modules/babel-polyfill/dist/polyfill.js',
      require.resolve('jasmine-stray-timers'),
      require.resolve('jasmine-stray-promises'),
      'node_modules/jasmine-fixture/dist/jasmine-fixture.js',
      'test/**/!(parser)/*.js'
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/**/*.js': ['webpack']
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // code coverage reporter
    coverageReporter: {
      reporters: [
        {
          type: 'text-summary'
        },
        {
          type: 'html',
          dir: 'coverage/'
        }
      ]
    },

    // Make webpack output less verbose
    webpackMiddleware: {
      noInfo: true,
      stats: {
        colors: true,
        version: false,
        assets: false,
        chunks: false,
        chunkModules: false
      }
    },


    webpack: {
      module: {
        loaders: [
          {
            test: /(\.js)$/,
            exclude: /node_modules/,
            loader: 'babel'
          }
        ]
      }
    }
  });
};
