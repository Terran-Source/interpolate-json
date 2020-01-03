'use strict';

const del = require('del');
const { task, series, parallel } = require('gulp');
const type = require('type-detect');

const scriptExt = 'js';
const compressJob = 'compress';
const copyJob = 'copy';
const localJob = 'local';
const outputDirectory = 'dist';
const sourceDirectories = ['lib'];
const testDirectories = ['tests'];
const localDirectories = [localJob];
const excludedDirectories = [
  ...sourceDirectories,
  ...testDirectories,
  'node_modules',
  'examples',
  'gulpfile.js',
  '.vscode'
];
const excludes = dirs => dirs.map(dir => `!.${safeDir(dir)}/**`);
const safeDir = dir =>
  !dir
    ? ''
    : '.' === dir
    ? ''
    : dir.toString().startsWith('/')
    ? dir
    : `/${dir}`;
const scriptDir = dir => `.${safeDir(dir)}/**/*.${scriptExt}`;
const copyDir = dir => [
  `.${safeDir(dir)}/**`,
  `.${safeDir(dir)}/**/.*`,
  `!${scriptDir(dir)}`
];
const outputDir = dir => `.${safeDir(outputDirectory)}${safeDir(dir)}`;
let allExcluded = [];
const compressScripts = (dir, isCustom) =>
  require(`./${compressJob}`)(
    `${compressJob}-${type(isCustom) !== 'number' ? isCustom : dir}`,
    [scriptDir(dir), ...allExcluded],
    outputDir(dir)
  );
const copyScripts = (dir, isCustom) =>
  require(`./${copyJob}`)(
    `${copyJob}-${type(isCustom) !== 'number' ? isCustom : dir}`,
    [...copyDir(dir), ...allExcluded],
    outputDir(dir)
  );
const dirTasks = dirs => [
  ...dirs.map(dir => `${compressJob}-${dir}`),
  ...dirs.map(dir => `${copyJob}-${dir}`)
];
const prepareTasks = (...dirs) => {
  dirs.forEach(compressScripts);
  dirs.forEach(copyScripts);
};

// prepare for all build & test tasks
prepareTasks(sourceDirectories, testDirectories);
// prepare for everything else left
allExcluded = excludes(excludedDirectories);
compressScripts('.', localJob);
copyScripts('.', localJob);

// clean output directory
task('clean', cb => {
  del.sync(outputDirectory, { force: true });
  cb();
});

const preBuild = series(
  'clean',
  parallel(...dirTasks(sourceDirectories), ...dirTasks(localDirectories))
);
const preTest = series(
  'clean',
  parallel(
    ...dirTasks(sourceDirectories),
    ...dirTasks(testDirectories),
    ...dirTasks(localDirectories)
  )
);

exports.preBuild = preBuild;
exports.preTest = preTest;
// gulp default task
exports.default = series(preTest);
