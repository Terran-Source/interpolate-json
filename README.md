# interpolate-json

Interpolate a Javascript Object or string with json - Advanced

Minimalist & lightweight ;) approach to handle interpolation, which packs way more punch than simple string replacement.

Supports:

1. `${string}` interpolation
2. `${json}` interpolation
3. `${multi.level}` json notation
4. single `${= JavaScript.expression() =}`

[![Travis (.org)](https://img.shields.io/travis/Terran-Source/interpolate-json?logo=travis&style=plastic)](https://travis-ci.org/Terran-Source/interpolate-json) [![node](https://img.shields.io/node/v/interpolate-json?logo=nodejs&style=plastic)](https://www.npmjs.com/package/interpolate-json) [![GitHub](https://img.shields.io/github/license/Terran-Source/interpolate-json?logo=github&style=plastic)](LICENSE) [![NPM version](https://img.shields.io/npm/v/interpolate-json.svg?style=plastic)](https://www.npmjs.com/package/interpolate-json)

## Install

```bash
# with npm
npm install interpolate-json

# or with Yarn
yarn add interpolate-json
```

## Usage

#### Declaration

```javascript
// declare the varible at the beginning
const { expand } = require('interpolate-json');
```

#### string

```javascript
// for Strings
let someString = 'I want to be ${character} in ${business.type} by being a ${business.post}';
let values = {
  character: 'a Hero',
  business: {
    type: 'saving people',
    post: 'Doctor' }
};
someString = expand(someString, values);
console.log(someString);
// output:  I want to be a Hero in saving people by being a Doctor

// or using ENVIRONMENT_VARIABLES
// test-string.js
let someString = "Hi, my name is '${USER_NAME}'. I'm ${USER_AGE}";
console.log(expand(someString, process.env));
// execute using: USER_NAME='John' USER_AGE=19 node test-string.js
// output:  Hi, my name is 'John'. I'm 19
```

#### json

```javascript
// Json
let myJson = {
  port: '8080',
  server: 'www.example.com',
  user: 'abcd',
  password: 'P@ss#ord',
  url: 'https://${user}:${= encodeURIComponent(${password}) =}@${server}:${port}'
};
console.log(expand(myJson)); // Look for values inside itself
// output:
{
  "port": "8080",
  "server": "www.example.com",
  "user": "abcd",
  "password": "P@ss#ord",
  "url": "https://abcd:P%40ss%23ord@www.example.com:8080"
}

// Let's sweeten the deal with ENVIRONMENT_VARIABLES
// test-json.js
let myJson = {
  port: '${PORT}',
  server: 'www.example.com',
  user: '${=${USER_NAME}.toLowerCase()=}',
  password: '${USER_PASSWORD}',
  url: 'https://${user}:${= encodeURIComponent(${password}) =}@${server}:${port}'
};

console.log(expand(myJson));
// execute using: PORT=8080 USER_NAME='John' USER_PASSWORD='P@ss#ord' node test-json.js
// output:
{
  "port": "8080",
  "server": "www.example.com",
  "user": "john",
  "password": "P@ss#ord",
  "url": "https://john:P%40ss%23ord@www.example.com:8080"
}

```

Notice that `${==}` notation. It's a cool way to use JavaScript expression (not expression<u>_s_</u>, yet, just a single line).

## Definition

Syntax: `expand(obj, values = null, options = {});`

The `expand` function takes 3 parameters

##### obj

- type: `string | json`

The object to be interpolated. For `string` type, [`values`](#values) must be provided. In case of `json` type, it can interpolate itself if the required values are all present.

##### values

- type: `json`
- default: null

The values for the interpolated parameter placeholders (i.e. `${param-name}`). In case of `json` type [`obj`](#obj), the [`values`](#values) override any of the existing [`obj`](#obj) properties (like, overriding with Environment variables). If any of the parameters is not present, it's replaced by empty string (`''`).

##### options

- type: `json`
- default:

```javascript
{
  debug: false,
  prefix: '${',
  suffix: '}',
  subKeyPointer: '.',
  funcSpecifier: '=',
  escapeSpecifier: '*'
}
```
more in [`Configurations`](#Configurations:)

#### returns:

- type: `string | json`

Based upon the type of the [`obj`](#obj). In case of any unsupported types, original [`obj`](#obj) will be returned.

> [Note: it does not change the actual [`obj`](#obj)]

#### Configurations:

(TODO:) Each section can be individually set through Environment Variables INTERPOLATE_OPTION_[*CONFIGNAME*] (or you can set it inside json [`obj`](#obj) or [`values`](#values). [Example](tests/config.func.custom.json))

###### debug

- type: `boolean`
- default: `false`
- Environment Variable override: `INTERPOLATE_OPTION_DEBUG`

Set it true turn on logging to help debug why certain things are not working as expected. Can be turned on [globally](<#debug()>).

###### prefix

- type: `string`
- default: `${`
- Environment Variable override: `INTERPOLATE_OPTION_PREFIX`

The prefix notation for an interpolation parameter.

###### suffix

- type: `string`
- default: `}`
- Environment Variable override: `INTERPOLATE_OPTION_SUFFIX`

The suffix notation for an interpolation parameter.

###### subKeyPointer

- type: `string`
- default: `.`
- Environment Variable override: `INTERPOLATE_OPTION_SUBKEYPOINTER`

The json  object tree sub-node pointer for interpolation parameter.

```javascript
let json = {
    a: "A",
    b: "B",
    c: {
        d: "D",
        e: "E",
        f: {
            g: "G"
        }
    }
}

// If  subKeyPointer = '.'
{
    reference: "${c.d}"
}

// If  subKeyPointer = '#'
{
    reference: "${c#f#g}"
}
```



###### funcSpecifier*

- type: `string`
- default: `=`
- Environment Variable override: `INTERPOLATE_OPTION_FUNCSPECIFIER`

The notation after [`prefix`](#prefix) & before [`suffix`](#suffix) to describe a function expression boundary. (e.g. `${= Func(${param1}, ${param2}) =}`). Must not be same as any of [`prefix`](#prefix), [`suffix`](#suffix), [`subKeyPointer`](#subKeyPointer) or [`escapeSpecifier`](#escapeSpecifier).

> It should not be touched unless really needed. Should be a single character (preferably a special character, e.g. #, =, *, <, >, ~ etc)

###### escapeSpecifier*

- type: `string`
- default: `*`
- Environment Variable override: `INTERPOLATE_OPTION_ESCAPESPECIFIER`

The notation after [`prefix`](#prefix) to escape string expression for certain data-types (like number, boolean etc.). Must not be same as any of [`prefix`](#prefix), [`suffix`](#suffix), [`subKeyPointer`](#subKeyPointer) or [`funcSpecifier`](#funcSpecifier).

> It should not also be touched either unless really needed. Should be a single character (preferably a special character, e.g. #, =, *, <, >, ~ etc).

```javascript
let json = {
    myKey: "${*keyValue}",
    isKey: "${*boolValue}"
}
// values = {keyValue: 123.45, boolValue: false}
 interpolatedJson = {
    myKey: 123.45, // instead of myKey: "123.45"
    isKey: false // instead of isKey: "false"
}
```



### Functions

```javascript
// When declared as a varible at the beginning
const interpolation = require('interpolate-json');
```

#### expand()

Described so far since [`Declaration`](#Declaration) & [`Definition`](#Definition).

#### debug()

Globally turn on [`debug`](#debug) flag.

```javascript
// to globally turn it on
const interpolation = require('interpolate-json').debug();

// to globally turn off
interpolation.debug(false);
```

#### reset()

Resets the [options](#options).

```javascript
const interpolation = require('interpolate-json');

// do some custom job
let result = interpolation.expand(someObj, process.env, {
  debug: true, // globally turn it on
  prefix: '{{', // not affecting next call
  suffix: '}}'
});

let result2 = interpolation.expand(someOtherObj); // `dubug` is still set as true, `prefix` & `siffix` will be '${' & '}' respectively

// now if you want to reset debug & all other options
interpolation.reset();
```
