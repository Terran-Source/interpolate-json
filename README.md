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

Get the full documentation in [WIKI](https://github.com/Terran-Source/interpolate-json/blob/master/WIKI.md)