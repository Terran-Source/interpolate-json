'use strict';

const type = require('type-detect');

const regexEscaped = /[\\/|#<>{}()[\]^$+\-*?,.:!%]/g;

const RegexEscaped = (str) =>
  type(str) === 'string' ? str.trim().replace(regexEscaped, '\\$&') : str;

module.exports = {
  RegexEscaped: RegexEscaped,
};
