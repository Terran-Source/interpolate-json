'use strict';

const extend = require('extend');
const type = require('type-detect');
const { BadRequest } = require('./exceptions');

const regexEscaped = /[\\/|#<>{}()[\]^$+*?.-:!]/g;
const escapeRegex = str =>
  type(str) === 'string' ? str.replace(regexEscaped, '\\$&') : str;

const main = () => {
  let defaultOptions = {
    debug: false,
    prefix: '${',
    suffix: '}',
    subKeyPointer: '.',
    funcSpecifier: '=',
    escapeSpecifier: '*',
    stringSpecifier: "'"
  };

  const getParamRegex = (opt, specifier) => {
    return new RegExp(
      escapeRegex(opt.prefix.trim()) +
        (type(specifier) === 'string' ? escapeRegex(specifier.trim()) : '') +
        '([\\s]*[\\w]+(?:' +
        escapeRegex(opt.subKeyPointer.trim()) +
        '[\\w]+)*[\\s]*)' +
        escapeRegex(opt.suffix.trim()),
      'g'
    );
  };

  const getFuncRegex = opt => getParamRegex(opt, opt.funcSpecifier);
  const getEscapeRegex = opt => {
    let _opt = { ...opt };
    _opt.prefix = '"' + _opt.prefix.trim();
    _opt.suffix = _opt.suffix.trim() + '"';
    return getParamRegex(_opt, _opt.escapeSpecifier);
  };
  const omitEscapeRegex = (str, escapeRegex, opt) =>
    str.replace(
      escapeRegex,
      (match, param) => `${opt.prefix}${param.trim()}${opt.suffix}`
    );
  const cleanEscapes = (str, escapeRegex, opt) =>
    str.replace(escapeRegex, (match, param) =>
      match.replace(
        `${opt.prefix.trim()}${opt.escapeSpecifier.trim()}`,
        `${opt.prefix.trim()}`
      )
    );
  const getStringEscapeRegex = opt => getParamRegex(opt, opt.stringSpecifier);
  const cleanStringEscapes = (str, escapeRegex, opt) =>
    str.replace(
      escapeRegex,
      (match, param) =>
        `${opt.stringSpecifier}${opt.prefix.trim()}` +
        `${param.trim()}${opt.suffix.trim()}` +
        `${opt.stringSpecifier}`
    );

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

  const acceptedValueTypes = new Set(['number', 'string', 'boolean']);

  const traverse = (obj, path, subKeyPointer) => {
    const result = path
      .split(subKeyPointer)
      .reduce((parent, key) => parent[key] || {}, obj);
    return acceptedValueTypes.has(type(result)) ? result : '';
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

  // todo: implementation
  const getInterpolatedFunc = (str, regex, values, keepAlive = false) => {
    log(`Found match: ${str.match(regex)}`);
    return str.replace(regex, (match, expression) => {
      expression = expression.trim();
      return values.hasOwnProperty(expression)
        ? values[expression].toString()
        : keepAlive
        ? match
        : '';
    });
  };

  const flattenAndResolve = (
    obj,
    matchSet,
    paramRegex,
    funcRegex,
    subKeyPointer
  ) => {
    let cache = {};
    matchSet.forEach(match => {
      // Step 1: Get current value
      let curVal = traverse(obj, match, subKeyPointer);
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
            paramRegex,
            subKeyPointer
          )
        );
        // Step 3.3: cache updated with missing matchSet. Clear to interpolate
        cache[match] = getInterpolated(curVal, paramRegex, cache);
      }
      //// todo
      // if (funcRegex.test(curVal)) {
      // }
      else cache[match] = curVal; // Step 3(alt): cache updated
    });
    return cache;
  };

  const interpolation = {
    [Symbol.toStringTag]: 'Interpolate-Json',
    expand: (obj, values = null, options = {}) => {
      let needToDo = false;
      const objType = type(obj);
      if (options.prefix && !options.suffix) options.suffix = '';
      options = extend({}, defaultOptions, options);
      const paramRegex = getParamRegex(options);
      const funcRegex = getFuncRegex(options);
      const escapeRegex = getEscapeRegex(options);
      const escapeStringRegex = getStringEscapeRegex(options);
      switch (objType) {
        case 'Object':
          let sObj = JSON.stringify(obj);
          if (escapeStringRegex.test(sObj)) {
            sObj = cleanStringEscapes(sObj, escapeStringRegex, options);
            obj = JSON.parse(sObj);
          }
          if (escapeRegex.test(sObj)) {
            obj = JSON.parse(cleanEscapes(sObj, escapeRegex, options));
            sObj = omitEscapeRegex(sObj, escapeRegex, options);
          }
          const cachedValue = extend({}, obj, values || {});
          obj = sObj;
          if (paramRegex.test(obj)) {
            const matches = obj.match(paramRegex);
            values = flattenAndResolve(
              cachedValue,
              getMatchSet(matches, paramRegex),
              paramRegex,
              funcRegex,
              options.subKeyPointer
            );
            needToDo = true;
          }
          break;
        case 'string':
          log(`Input: "${obj}"`);
          if (paramRegex.test(obj)) needToDo = true;
          else break;

          if (null === values) {
            traceNThrow('Please provide "values"', BadRequest);
          }
          break;
        default:
          trace(`Interpolation for ${objType} has not yet been implemented`);
          return obj;
      }
      log(`before interpolation:\n${obj}`);
      const result = needToDo ? getInterpolated(obj, paramRegex, values) : obj;
      log(`after interpolation:\n${result}`);

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
