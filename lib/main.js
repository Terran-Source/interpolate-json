'use strict';

const extend = require('extend');
const type = require('type-detect');
const { BadRequest } = require('custom-exception');
const { subtract } = require('./set-operations');
const { RegexEscaped, FixRegexStickyTest } = require('./regexp-extensions');

// regex constants
const spaces = '[\\s]*';
const paramExpressionSet = '[\\w]+';

// function regex constants
const allowedFuncExpressions = `{}()+-_*/%:|?,.$!&#'`;
const funcExpressionSet = `[\\s\\w${RegexEscaped(allowedFuncExpressions)}]+`;
const allowedOperators = ['==', '===', '!=', '!==', '<', '<=', '>', '>='];
const getOperatorSet = allowedOperators.map((op) => RegexEscaped(op)).join('|');

const acceptedValueTypes = new Set(['number', 'string', 'boolean']);

const isArgument = (arg, argType) =>
  arg && type(arg) === (argType || type(arg));
const isFunction = (obj) => 'function' === type(obj);

const envPrefix = 'INTERPOLATE_OPTION_';
const debugEnv = `${envPrefix}DEBUG`;
const isDebug = () =>
  'true' === (process.env[debugEnv] || '').toString().toLowerCase();
const log = (message) => {
  if (isDebug()) console.log(`[dotconfig][debug]: ${message}`);
};

const trace = (message) => {
  if (isDebug()) console.trace(`[dotconfig][error]: ${message}`);
};

const traceNThrow = (errMessage, ErrorHandler) => {
  trace(errMessage);
  if (type(ErrorHandler) === 'Exception') throw new ErrorHandler(errMessage);
  else throw new Error(errMessage);
};

const InterpolateOption = function (
  prefix = '${',
  suffix = '}',
  subKeyPointer = '.'
) {
  let _th = {};

  const _checkSuffix = () => {
    _th.suffix = !_th.suffix ? '' : _th.suffix;
  };

  const _defineFixedProperties = (obj) => {
    Object.defineProperty(obj, 'funcSpecifier', {
      value: '=',
      writable: false,
      enumerable: false,
    });
    Object.defineProperty(obj, 'escapeSpecifier', {
      value: '*',
      writable: false,
      enumerable: false,
    });
  };

  const _init = () => {
    _th[Symbol.toStringTag] = 'InterpolateOption';
    _th.prefix = prefix;
    _th.suffix = suffix;
    _th.subKeyPointer = subKeyPointer;
    _defineFixedProperties(_th);
    _checkSuffix();
    return _th;
  };

  _th.updateOption = (value, external = false) => {
    const isValidValue = isArgument(value, 'Object');
    for (let key in _th) {
      if (!isFunction(_th[key])) {
        let envKey = `${envPrefix}${key.toUpperCase()}`;
        let k;
        if (isValidValue) {
          k = !external ? key : envKey;
        }
        _th[key] =
          isValidValue && value.hasOwnProperty(k)
            ? value[k]
            : process.env[envKey] || _th[key];
      }
    }
    _checkSuffix();
    return _th;
  };

  _th.clone = () => {
    var cloned = { ..._th };
    _defineFixedProperties(cloned);
    return cloned;
  };

  _th.cloneFrom = (option) => {
    if ('InterpolateOption' === type(option)) {
      _th.prefix = option.prefix;
      _th.suffix = option.suffix;
      _th.subKeyPointer = option.subKeyPointer;
    }
    _checkSuffix();
    return _th;
  };

  // let's initiate
  return _init();
};

const Interpolation = function (interpolateOption = InterpolateOption()) {
  let _th = {};
  let _interpolateOption = null;
  let _optionBackup;
  let _paramRegex;
  let _funcRegex;
  let _escapeRegex;

  const _backupOption = () => {
    if (null !== _interpolateOption) _optionBackup = _interpolateOption.clone();
  };

  const _updateRegex = () => {
    _paramRegex = _getParamRegex();
    _funcRegex = _getFuncRegex(_interpolateOption);
    _escapeRegex = _getEscapeRegex();
  };

  const _updateOption = (obj, external = false) => {
    _interpolateOption.updateOption(obj, external);
    _updateRegex();
  };

  const _resetOption = () => {
    _interpolateOption.cloneFrom(_optionBackup);
    _updateRegex();
  };

  const _init = () => {
    if ('InterpolateOption' !== type(interpolateOption))
      traceNThrow('Please provide "values"', BadRequest);
    _th[Symbol.toStringTag] = 'Interpolation';
    _interpolateOption = interpolateOption;
    // Check for ENVIRONMENT set variables
    _interpolateOption.updateOption();
    _backupOption();
    _updateRegex();
    return _th;
  };

  const _getParamRegex = (specifier) => {
    let regex = new RegExp(
      RegexEscaped(_interpolateOption.prefix) +
        (isArgument(specifier, 'string') ? RegexEscaped(specifier) : '') +
        `(${spaces}${paramExpressionSet}` +
        `(?:(${RegexEscaped(_interpolateOption.subKeyPointer)})` +
        `${paramExpressionSet})*` +
        `${!_interpolateOption.suffix ? '' : spaces})` +
        RegexEscaped(_interpolateOption.suffix),
      'g'
    );
    FixRegexStickyTest(regex);
    return regex;
  };

  const _getFuncRegex = (opt, isEscapeRegex = false) => {
    let regex = new RegExp(
      RegexEscaped(opt.prefix) +
        (isEscapeRegex ? '((' : '') +
        RegexEscaped(opt.funcSpecifier) +
        (isEscapeRegex ? ')?' : '') +
        `(${spaces}${funcExpressionSet}` +
        `(?:(${getOperatorSet})${funcExpressionSet})*${spaces})` +
        (isEscapeRegex ? '(' : '') +
        RegexEscaped(opt.funcSpecifier) +
        (isEscapeRegex ? ')?)' : '') +
        RegexEscaped(opt.suffix),
      'g'
    );
    FixRegexStickyTest(regex);
    return regex;
  };

  const _getEscapeRegex = () => {
    let _opt = _interpolateOption.clone();
    _opt.prefix = '"' + _opt.prefix.trim() + _opt.escapeSpecifier.trim();
    _opt.suffix = _opt.suffix.trim() + '"';
    return _getFuncRegex(_opt, true);
  };

  // "${*XXyy1234}" => ${XXyy1234} (i.e. omit both quote(") & *)
  const _omitEscapeRegex = (str) =>
    str.replace(
      _escapeRegex,
      (match, param) =>
        `${_interpolateOption.prefix}${param.trim()}${
          _interpolateOption.suffix
        }`
    );
  // "${*XXyy1234}" => "${XXyy1234}" (i.e. omit * from prefix)
  // "${*=XXyy1234=}" => "${=XXyy1234=}" (i.e. omit * from func expression)
  const _cleanEscapes = (str) =>
    str.replace(_escapeRegex, (match, param) =>
      match.replace(
        `${_interpolateOption.prefix.trim()}${_interpolateOption.escapeSpecifier.trim()}`,
        `${_interpolateOption.prefix.trim()}`
      )
    );

  const _missingKeyKeepAlive = (key) =>
    `${_interpolateOption.prefix}${key}${_interpolateOption.suffix}`;

  const _traverse = (obj, path, keepAlive = false) => {
    const result = path
      .split(_interpolateOption.subKeyPointer)
      .reduce((parent, key) => parent[key] || {}, obj);
    return acceptedValueTypes.has(type(result))
      ? result
      : keepAlive
      ? _missingKeyKeepAlive(path)
      : '';
  };

  const _getMatchSet = (matches) =>
    new Set(
      matches.reduce((arr, match) => {
        arr.push(match.replace(_paramRegex, (m, val) => val.trim()));
        return arr;
      }, [])
    );

  const _getInterpolated = (str, values, keepAlive = false) => {
    log(`Found match: ${str.match(_paramRegex)}`);
    return str.replace(_paramRegex, (match, param) => {
      param = param.trim();
      return values.hasOwnProperty(param)
        ? values[param].toString()
        : keepAlive
        ? match
        : '';
    });
  };

  const _getInterpolatedFunc = (str, values, keepAlive = false) => {
    log(`Found func match: ${str.match(_funcRegex)}`);
    return str.replace(_funcRegex, (match, expression) => {
      let $val = {};
      expression = expression.trim().replace(_paramRegex, (m, param) => {
        $val[param] = values.hasOwnProperty(param)
          ? values[param].toString()
          : '';
        return `$val['${param}']`;
      });
      return new Function('$val', `return ${expression}`)($val);
    });
  };

  const _flattenAndResolve = (obj, matchSet, oldCache, keepAlive = false) => {
    let cache = oldCache || {};
    matchSet.forEach((match) => {
      if (cache.hasOwnProperty(match)) return;
      let hasParam = false;
      // Step 1: Get current value
      let curVal = _traverse(obj, match, keepAlive);
      // Step 2: If it contains other parameters
      if (
        _missingKeyKeepAlive(match) !== curVal &&
        _paramRegex.nonStickyTest(curVal)
      ) {
        // it's time to update cache with missing matchSet
        cache = _flattenAndResolve(
          obj,
          subtract(
            _getMatchSet(curVal.match(_paramRegex)),
            new Set(Object.keys(cache))
          ),
          cache,
          keepAlive
        );
        hasParam = true;
      }
      // Step 3: If it contains function expression
      if (_funcRegex.nonStickyTest(curVal)) {
        // we already gathered all params in the last step, so
        curVal = _getInterpolatedFunc(curVal, cache);
      }
      // Step 4: If it still contains other parameters
      if (hasParam && _paramRegex.nonStickyTest(curVal)) {
        curVal = _getInterpolated(curVal, cache, keepAlive);
      }
      // Step 5: Finally
      cache[match] = curVal;
    });
    return cache;
  };

  const _containsOption = (obj) =>
    Object.keys(obj).some((key) => key.startsWith(envPrefix));

  _th.expand = (obj, values = null, options = null) => {
    let needToDo = false;
    let optionsChanged = false;
    const objType = type(obj);
    if (
      isArgument(options, 'Object') ||
      isArgument(options, 'InterpolateOption')
    ) {
      if (options.prefix && !options.suffix) options.suffix = '';
      _updateOption(options);
      optionsChanged = true;
    } else {
      if (isArgument(values, 'Object') && _containsOption(values)) {
        _updateOption(values, true);
        optionsChanged = true;
      } else if (isArgument(obj, 'Object') && _containsOption(obj)) {
        _updateOption(obj, true);
        optionsChanged = true;
      }
    }
    var cachedValue = {};

    switch (objType) {
      case 'Object':
        let sObj = JSON.stringify(obj);
        if (_escapeRegex.nonStickyTest(sObj)) {
          obj = JSON.parse(_cleanEscapes(sObj));
          sObj = _omitEscapeRegex(sObj);
        }
        cachedValue = extend(cachedValue, obj, values || {});
        obj = sObj;
        break;
      case 'string':
        log(`Input: "${obj}"`);
        if (_paramRegex.nonStickyTest(obj) && null === values) {
          traceNThrow('Please provide "values"', BadRequest);
        }
        cachedValue = extend(cachedValue, values);
        break;
      default:
        trace(`Interpolation for ${objType} has not yet been implemented`);
        return obj;
    }

    log(`before interpolation:\n${obj}`);
    let result = '';
    if (_paramRegex.nonStickyTest(obj)) {
      const matches = obj.match(_paramRegex);
      values = _flattenAndResolve(cachedValue, _getMatchSet(matches));
      log(`all values: ${JSON.stringify(values, null, 2)}`);
      needToDo = true;
    }
    if (needToDo) {
      result = _getInterpolatedFunc(obj, values);
      result = _getInterpolated(result, values);
    } else result = obj;
    log(`after interpolation:\n${result}`);
    if (optionsChanged) _resetOption();
    switch (objType) {
      case 'Object':
        return JSON.parse(result);
      case 'string':
      default:
        return result;
    }
  };

  _th.debug = (flag = true) => {
    process.env[debugEnv] = flag.toString();
    return _th;
  };

  // let's initiate
  return _init();
};

module.exports = {
  InterpolateOption: InterpolateOption,
  Interpolation: Interpolation,
  interpolation: Interpolation(),
};
