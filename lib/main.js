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
        '([\\s]*[\\w\\.]+[\\s]*)' +
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

  const traverse = (obj, path) => {
    let result = path
      .split('.')
      .reduce((parent, key) => parent[key] || {}, obj);
    return type(result) === 'number' || type(result) === 'string' ? result : '';
  };

  const getMatchSet = (matches, paramRegex) =>
    new Set(
      matches.reduce((arr, match) => {
        arr.push(match.replace(paramRegex, (m, val) => val.trim()));
        return arr;
      }, [])
    );

  const getInterpolated = (str, regex, values, keepAlive = false) => {
    log(`Found match: ${str.match(regex)}`);
    return str.replace(regex, (match, param) => {
      param = param.trim();
      return values.hasOwnProperty(param)
        ? values[param].toString()
        : keepAlive
        ? match
        : '';
    });
  };

  const flattenAndResolve = (obj, matchSet, paramRegex) => {
    let cache = {};
    matchSet.forEach(match => {
      // Step 1: Get current value
      let curVal = traverse(obj, match);
      // Step 2: Is it clean
      if (paramRegex.test(curVal)) {
        // Step 2.2: Try to clean it with existing state of cache
        curVal = getInterpolated(curVal, paramRegex, cache, true);
      }
      // Step 3: Is it clean after Step 2 check & cleanup
      if (paramRegex.test(curVal)) {
        // Step 3.2: If not, it's time to update cache with missing matchSet
        extend(
          cache,
          flattenAndResolve(
            obj,
            getMatchSet(curVal.match(paramRegex), paramRegex),
            paramRegex
          )
        );
        // Step 3.3: cache updated with missing matchSet. Clear to interpolate
        cache[match] = getInterpolated(curVal, paramRegex, cache);
      } else cache[match] = curVal; // Step 3(alt): cache updated
    });
    return cache;
  };

  const interpolation = {
    [Symbol.toStringTag]: 'Interpolate-Json',
    do: (obj, values = null, options = {}) => {
      let objType = type(obj);
      if (options.prefix && !options.suffix) options.suffix = '';
      options = extend({}, defaultOptions, options);
      const paramRegex = getParamRegex(options);
      switch (objType) {
        case 'Object':
          let cachedValue = extend({}, obj, values || {});
          obj = JSON.stringify(obj);
          let matches = obj.match(paramRegex);
          values = flattenAndResolve(
            cachedValue,
            getMatchSet(matches, paramRegex),
            paramRegex
          );
          break;
        case 'string':
          log(`Input: "${obj}"`);
          if (null === values) {
            traceNThrow('Please provide "values"', BadRequest);
          }
          break;
        default:
          trace(`Interpolation for ${objType} has not yet been implemented`);
          return obj;
      }
      const result = getInterpolated(obj, paramRegex, values);
      switch (objType) {
        case 'Object':
          return JSON.parse(result);
        case 'string':
        default:
          return result;
      }
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
