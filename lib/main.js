const extend = require('extend');
const type = require('type-detect');
const { NotImplementedException, BadRequest } = require('./exceptions');

const regexEscaped = /[\\/|#<>{}()[\]^$+*?.-\:\!]/g;
const escapeRegex = str =>
  type(str) === 'string' ? str.replace(regexEscaped, '\\$&') : str;

const main = () => {
  let defaultOptions = {
    debug: false,
    prefix: '${',
    suffix: '}'
  };

  const getParamRegex = opt => {
    return new RegExp(
      escapeRegex(opt.prefix.trim()) +
        '([\\s]*[\\w]+[\\s]*)' +
        escapeRegex(opt.suffix.trim()),
      'g'
    );
  };

  const backupOptions = { ...defaultOptions };

  const log = message => {
    if (defaultOptions.debug) console.log(`[dotconfig][debug]: ${message}`);
  };

  const trace = message => {
    if (defaultOptions.debug) console.trace(`[dotconfig][error]: ${message}`);
  };

  const traceNThrow = (errMessage, ErrorHandler) => {
    trace(errMessage);
    if (type(ErrorHandler) === 'Exception') throw new ErrorHandler(errMessage);
    else throw new Error(errMessage);
  };

  const getInterpolated = (str, regex, values) => {
    log(`Found match: ${str.match(regex)}`);
    return str.replace(regex, (match, param) => {
      param = param.trim();
      return values.hasOwnProperty(param) ? values[param].toString() : '';
    });
  };

  const interpolation = {
    [Symbol.toStringTag]: 'Interpolate-Json',
    do: (obj, values = null, options = {}) => {
      switch (type(obj)) {
        case 'Object':
          // todo: implementation
          break;
        case 'string':
          log(`Input: "${obj}"`);
          if (null === values) {
            traceNThrow('Please provide "values"', BadRequest);
          }
          break;
        default:
          traceNThrow(
            `Interpolation for ${type(obj)} has not yet been implemented`,
            NotImplementedException
          );
      }
      if (options.prefix && !options.suffix) options.suffix = '';
      options = extend({}, defaultOptions, options);
      return getInterpolated(obj, getParamRegex(options), values);
    },
    debug: () => {
      defaultOptions.debug = true;
    },
    reset: () => {
      defaultOptions = { ...backupOptions };
    }
  };

  return interpolation;
};

module.exports = main();
