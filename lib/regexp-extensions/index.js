'use strict';

const type = require('type-detect');

const escapedRegex = /[\\/|#<>{}()[\]^$+\-*?,.:!%]/g;

const RegexEscaped = (str) =>
  type(str) === 'string' ? str.trim().replace(escapedRegex, '\\$&') : str;

const _fixRegexStickyTest = (regex) => {
  regex.nonStickyTest = (str) => {
    regex.lastIndex = 0;
    let result = regex.test(str);
    regex.lastIndex = 0;
    return result;
  };
};

module.exports = {
  RegexEscaped: RegexEscaped,
  FixRegexStickyTest: _fixRegexStickyTest,
};
