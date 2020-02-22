'use strict';

const extend = require('extend');
const type = require('type-detect');
const { BadRequest } = require('./exceptions');
const { subtract } = require('./setoperations');

const regexEscaped = /[\\/|#<>{}()[\]^$+\-*?,.:!%]/g;
const escapeRegex = str =>
  type(str) === 'string' ? str.replace(regexEscaped, '\\$&') : str;

const main = () => {
  let defaultOptions = {
    debug: false,
    prefix: '${',
    suffix: '}',
    subKeyPointer: '.',
    funcSpecifier: '=',
    escapeSpecifier: '*'
  };

  const getParamRegex = (opt, specifier) =>
    new RegExp(
      escapeRegex(opt.prefix.trim()) +
        (type(specifier) === 'string' ? escapeRegex(specifier.trim()) : '') +
        '([\\s]*[\\w]+(?:' +
        escapeRegex(opt.subKeyPointer.trim()) +
        '[\\w]+)*[\\s]*)' +
        escapeRegex(opt.suffix.trim()),
      'g'
    );

  const expressionSet = `[\\s\\w${escapeRegex("{}()+-*/%:|<>?,.$!&'#")}]+`;

  const getFuncRegex = (opt, isEscapeRegex = false) =>
    //getParamRegex(opt, opt.funcSpecifier);
    new RegExp(
      escapeRegex(opt.prefix.trim()) +
        (isEscapeRegex ? '((' : '') +
        escapeRegex(opt.funcSpecifier.trim()) +
        (isEscapeRegex ? ')?' : '') +
        `(${expressionSet}` +
        `(?:((==|===)(${expressionSet})))*[\\s]*)` +
        (isEscapeRegex ? '(' : '') +
        escapeRegex(opt.funcSpecifier.trim()) +
        (isEscapeRegex ? ')?)' : '') +
        escapeRegex(opt.suffix.trim()),
      'g'
    );
  const getEscapeRegex = opt => {
    let _opt = { ...opt };
    _opt.prefix = '"' + _opt.prefix.trim() + _opt.escapeSpecifier.trim();
    _opt.suffix = _opt.suffix.trim() + '"';
    return getFuncRegex(_opt, true);
  };

  // "${*XXyy1234}" => ${XXyy1234} (i.e. omit both quote(") & *)
  const omitEscapeRegex = (str, escapeRegex, opt) =>
    str.replace(
      escapeRegex,
      (match, param) => `${opt.prefix}${param.trim()}${opt.suffix}`
    );
  // "${*XXyy1234}" => "${XXyy1234}" (i.e. omit * from prefix)
  // "${*=XXyy1234=}" => "${=XXyy1234=}" (i.e. omit * from func expression)
  const cleanEscapes = (str, escapeRegex, opt) =>
    str.replace(escapeRegex, (match, param) =>
      match.replace(
        `${opt.prefix.trim()}${opt.escapeSpecifier.trim()}`,
        `${opt.prefix.trim()}`
      )
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
  const getInterpolatedFunc = (
    str,
    funcRegex,
    paramRegex,
    values,
    keepAlive = false
  ) => {
    log(`Found func match: ${str.match(funcRegex)}`);
    return str.replace(funcRegex, (match, expression) => {
      let $val = {};
      expression = expression.trim().replace(paramRegex, (m, param) => {
        $val[param] = values.hasOwnProperty(param)
          ? values[param].toString()
          : '';
        return `$val['${param}']`;
      });
      return new Function('$val', `return ${expression}`)($val);
    });
  };

  const flattenAndResolve = (
    obj,
    matchSet,
    paramRegex,
    funcRegex,
    subKeyPointer,
    oldCache
  ) => {
    let cache = oldCache || {};
    matchSet.forEach(match => {
      let hasParam = false;
      // Step 1: Get current value
      let curVal = traverse(obj, match, subKeyPointer);
      // Step 2: If it contains other parameters
      if (paramRegex.test(curVal)) {
        // it's time to update cache with missing matchSet
        cache = flattenAndResolve(
          obj,
          subtract(
            getMatchSet(curVal.match(paramRegex), paramRegex),
            new Set(Object.keys(cache))
          ),
          paramRegex,
          funcRegex,
          subKeyPointer,
          cache
        );
        hasParam = true;
      }
      // Step 3: If it contains function expression
      if (funcRegex.test(curVal)) {
        // we already gathered all params in the last step, so
        curVal = getInterpolatedFunc(curVal, funcRegex, paramRegex, cache);
      }
      // Step 4: If it still contains other parameters
      if (hasParam && paramRegex.test(curVal)) {
        curVal = getInterpolated(curVal, paramRegex, cache);
      }
      // Step 5: Finally
      cache[match] = curVal;
    });
    return cache;
  };

  const undefinedOrFirst = (...args) => {
    let result;
    const counter = args.length;
    for (let i = 0; i < counter; i++) {
      let arg = args[i];
      if (undefined !== arg && null !== arg) {
        result = arg;
        break;
      }
    }
    return result;
  };

  const extendedOptions = (objType, obj, values, options) => {
    let result = {};
    Object.keys(defaultOptions).forEach(key => {
      let envKey = `INTERPOLATE_OPTION_${key.toUpperCase()}`;
      result[key] = undefinedOrFirst(
        options[key], // priority I
        process.env[envKey], // priority II
        (values || {})[envKey], // priority III
        ('Object' === objType ? obj : {})[envKey], // priority IV
        defaultOptions[key] // fall back to default
      );
    });
    return result;
  };

  const interpolation = {
    [Symbol.toStringTag]: 'Interpolate-Json',
    expand: (obj, values = null, options = {}) => {
      let needToDo = false;
      const objType = type(obj);
      if (options.prefix && !options.suffix) options.suffix = '';
      options = extendedOptions(objType, obj, values, options);
      defaultOptions.debug = options.debug;
      const paramRegex = getParamRegex(options);
      const funcRegex = getFuncRegex(options);
      const escapeRegex = getEscapeRegex(options);
      switch (objType) {
        case 'Object':
          let sObj = JSON.stringify(obj);
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
            log(`all values: ${JSON.stringify(values, null, 2)}`);
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
      let result = '';
      if (needToDo) {
        result = getInterpolatedFunc(obj, funcRegex, paramRegex, values);
        result = getInterpolated(result, paramRegex, values);
      } else result = obj;
      log(`after interpolation:\n${result}`);

      switch (objType) {
        case 'Object':
          return JSON.parse(result);
        case 'string':
        default:
          return result;
      }
    },
    debug: (flag = true) => {
      defaultOptions.debug = flag;
      return this;
    },
    reset: () => {
      defaultOptions = { ...backupOptions };
      return this;
    }
  };

  return interpolation;
};

module.exports = main();
