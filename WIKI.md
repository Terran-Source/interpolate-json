# interpolate-json [![NPM version](https://img.shields.io/npm/v/interpolate-json.svg?style=plastic)](https://www.npmjs.com/package/interpolate-json)

![GitHub Workflow Status (with event)](https://img.shields.io/github/actions/workflow/status/Terran-Source/interpolate-json/main.yml?event=push&label=Github-Build&style=plastic) [![node](https://img.shields.io/node/v/interpolate-json?logo=nodejs&style=plastic)](https://www.npmjs.com/package/interpolate-json) [![GitHub](https://img.shields.io/github/license/Terran-Source/interpolate-json?logo=github&style=plastic)](LICENSE)

Interpolate a Javascript Object (json) or string with (another) **json** - Advanced (or ***Substitution***, as others may like to call it).

Minimalist & lightweight ;) approach to handle interpolation, which packs way more punch than simple string *parameter* replacement.

Supports:

1. `${string}` interpolation
2. `${json}` interpolation
3. `${multi.level}` json notation
4. single `${= JavaScript.expression() =}` evaluation
5. custom `{{parameter_boundary}}` declaration

## Install

```bash
# with npm
npm install interpolate-json

# or with Yarn
yarn add interpolate-json
```
> Imp: If you're using Node v12 then install the legacy version `"^2.3.0"`
> ```
> npm install interpolate-json@^2.3.0
> // or
> yarn add interpolate-json@^2.3.0
> ```

## Usage

#### Declaration

```javascript
// declare the varible at the beginning
const interpolation = require('interpolate-json').interpolation;
// or
const { interpolation } = require('interpolate-json');
```
```typescript
// or the import syntax
import { interpolation } from 'interpolate-json';
```

#### string

```javascript
// String
let someString = 'I want to be ${character} in ${business.type} by being a ${business.post}';
let values = {
  character: 'a Hero',
  business: {
    type: 'saving people',
    post: 'Doctor',
  },
};
someString = interpolation.expand(someString, values);
console.log(someString);
// output:  I want to be a Hero in saving people by being a Doctor

// or using ENVIRONMENT_VARIABLES
// test-string.js
let someString = "Hi, my name is '${USER_NAME}'. I'm ${USER_AGE}";
console.log(interpolation.expand(someString, process.env));
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
console.log(interpolation.expand(myJson)); // Look for values inside itself
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

console.log(interpolation.expand(myJson));
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

> Notice that `${= =}` notation. It's a cool way to use JavaScript expression (not expression<u>_s_</u>, yet, just a single line).

## Definition

Syntax: `interpolation.expand(obj, values = null, options = null);`

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
  prefix: '${',
  suffix: '}',
  subKeyPointer: '.',
  funcSpecifier: '=', // *read-only
  escapeSpecifier: '*' // *read-only
}
```
more in [`Configurations`](#configurations)

#### returns:

- type: `string | json`

Based upon the type of the [`obj`](#obj). In case of any unsupported types, original [`obj`](#obj) will be returned.

> [Note: it does not change the actual [`obj`](#obj)]

#### Configurations

The [`options`](#options) setup. Each section can be individually set through Environment Variables INTERPOLATE\_OPTION\_[*CONFIGNAME*] (or you can also set it inside [`values`](#values) or `json` type [`obj`](#obj). See an extreme [Example](tests/config.func.custom.option.json))

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

The json object tree sub-node pointer for interpolation parameter. The possible value is restricted to dot(`.`), hash(`#`), underscore(`_`) & colon(`:`) (or it's multiple, like: `::` etc)

```javascript
let json = {
  a: 'A',
  b: 'B',
  c: {
    d: 'D',
    e: 'E',
    f: {
      g: 'G',
    },
  },
};

// If  subKeyPointer = '.'
{
  reference: '${c.d}';
}

// If  subKeyPointer = '#'
{
  reference: '${c#f#g}';
}
```

###### funcSpecifier \*(read-only)

- type: `string`
- ***fixed value***: `=`

The notation after [`prefix`](#prefix) & before [`suffix`](#suffix) to describe a function expression boundary. (e.g. `${= Func(${param1}, ${param2}) =}`).

###### escapeSpecifier \*(read-only)

- type: `string`
- ***fixed value***: `*`

The notation after [`prefix`](#prefix) to escape string expression for certain data-types (like number, boolean etc.).

> This option is only applicable to `json` type [`obj`](#obj)

```javascript
let json = {
  myKey: '${*keyValue}',
  isKey: '${*boolValue}',
};
// values = {keyValue: 123.45, boolValue: false}
interpolatedJson = {
  myKey: 123.45, // instead of myKey: "123.45"
  isKey: false, // instead of isKey: "false"
};
```

### Methods

```javascript
// When declared as a variable at the beginning
const interpolation = require('interpolate-json');
```

#### expand()

Described so far since [`Declaration`](#declaration) & [`Definition`](#definition).

```javascript
// Syntax I
const interpolation = require('interpolate-json').interpolation;
interpolation.expand(obj, value);

// Syntax II
const { interpolation } = require('interpolate-json');
interpolation.expand(obj, value);
```

#### debug()

Globally turn on `debug` flag. If set to `true`, it'll write console output of detailed operations to help debug why certain things are (not) working as expected.

Can also be turned on via setting Environment Variable `INTERPOLATE_OPTION_DEBUG` to `true`

```javascript
// to globally turn it on
const interpolation = require('interpolate-json').interpolation;
interpolation.debug();

// to globally turn off debugging output
interpolation.debug(false);
```
