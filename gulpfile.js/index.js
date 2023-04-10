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
  '.vs',
  '.vscode',
  '.github',
  '.git',
];
const excludedFiles = [
  '.gitignore',
  '.editorconfig',
  '.*rc',
  '*.travis.yml',
  'CHANGELOG.md',
  'WIKI.md',
];
const sanitizeItems = ['yarn.lock'];
const excludes = (dirs, files) => [
  ...dirs.map((dir) => `!.${safeDir(dir)}/**`),
  ...files.map((file) => `!./**${safeDir(file)}`),
];
const safeDir = (dir) =>
  !dir
    ? ''
    : '.' === dir
    ? ''
    : dir.toString().startsWith('/')
    ? dir
    : `/${dir}`;
const scriptDir = (dir) => [
  `.${safeDir(dir)}/**/*.${scriptExt}`,
  `.${safeDir(dir)}/**/.*/**/*.${scriptExt}`,
];
const copyDir = (dir) => [
  `.${safeDir(dir)}/**`,
  `.${safeDir(dir)}/**/.*`,
  `.${safeDir(dir)}/**/.*/**`,
  ...scriptDir(dir).map((d) => `!${d}`),
];
const outputDir = (dir) => `.${safeDir(outputDirectory)}${safeDir(dir)}`;
let allExcluded = [];
const compressScripts = (dir, isCustom) =>
  require(`./${compressJob}`)(
    `${compressJob}-${type(isCustom) !== 'number' ? isCustom : dir}`,
    [...scriptDir(dir), ...allExcluded],
    outputDir(dir)
  );
const copyScripts = (dir, isCustom) =>
  require(`./${copyJob}`)(
    `${copyJob}-${type(isCustom) !== 'number' ? isCustom : dir}`,
    [...copyDir(dir), ...allExcluded],
    outputDir(dir)
  );
const dirTasks = (dirs) => [
  ...dirs.map((dir) => `${compressJob}-${dir}`),
  ...dirs.map((dir) => `${copyJob}-${dir}`),
];
const prepareTasks = (...dirs) => {
  dirs.forEach(compressScripts);
  dirs.forEach(copyScripts);
};

// prepare for all build & test tasks
prepareTasks(sourceDirectories, testDirectories);
// prepare for everything else left
allExcluded = excludes(excludedDirectories, excludedFiles);
compressScripts('.', localJob);
copyScripts('.', localJob);

// clean output directory
task('clean', (cb) => {
  del.sync(outputDirectory, { force: true });
  cb();
});
task('sanitize', (cb) => {
  del.sync(sanitizeItems.map(outputDir), { force: true });
  cb();
});

const preBuild = series(
  'clean',
  parallel(...dirTasks(sourceDirectories), ...dirTasks(localDirectories)),
  'sanitize'
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
