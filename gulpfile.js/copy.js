'use strict';

const { BadRequest } = require('../lib/exceptions');
const { task, src, dest } = require('gulp');
const { pipeline } = require('readable-stream');

const checkMandatoryParams = (...args) => {
  args.forEach(arg => {
    if (!arg[0]) throw new BadRequest(`Please provide parameter: "${arg[1]}".`);
  });
};

const main = (taskName, srcFiles, outputDirectory) => {
  checkMandatoryParams(
    [taskName, 'taskName'],
    [srcFiles, 'srcFiles'],
    [outputDirectory, 'outputDirectory']
  );

  // copy files
  return task(taskName, cb => {
    pipeline(src(srcFiles), dest(outputDirectory), err => {
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
      return success ? Promise.resolve(message) : Promise.reject(message);
    });
    cb();
  });
};

module.exports = main;
