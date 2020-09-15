'use strict';

const { BadRequest } = require('custom-exception');
const extend = require('extend');
const { task, src, dest } = require('gulp');
const terser = require('gulp-terser');
const { pipeline } = require('readable-stream');

const _terserOptions = {
  ecma: 6,
  output: {
    beautify: false,
  },
  keep_classnames: true,
  keep_fnames: true,
};

const checkMandatoryParams = (...args) => {
  args.forEach((arg) => {
    if (!arg[0]) throw new BadRequest(`Please provide parameter: "${arg[1]}".`);
  });
};

const main = (taskName, srcFiles, outputDirectory, terserOptions = {}) => {
  checkMandatoryParams(
    [taskName, 'taskName'],
    [srcFiles, 'srcFiles'],
    [outputDirectory, 'outputDirectory']
  );

  extend(_terserOptions, terserOptions);
  // minify javascripts
  return task(taskName, (cb) => {
    pipeline(
      src(srcFiles),
      terser(_terserOptions),
      dest(outputDirectory),
      (err) => {
        let message = '';
        let success = true;
        if (err) {
          message = err.message;
          console.trace(err);
          success = false;
        } else {
          message = `${taskName} task completed successfully`;
          console.log(message);
        }
        cb();
      }
    );
  });
};

module.exports = main;
