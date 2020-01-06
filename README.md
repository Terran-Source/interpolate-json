# interpolate-json

Interpolate a Javascript (Node.js V8) Object or string with json - Advanced

Minimalist & lightweight approach to handle interpolation which packs way more punch than simple string replacement.

Supports:

1. `${string}` interpolation
2. `${json}` interpolation
3. `${multi.level}` json notation
4. single line `${= JavaScript.expression() =}`

[![Travis (.org)](https://img.shields.io/travis/Terran-Source/interpolate-json?logo=travis&style=plastic)](https://travis-ci.org/Terran-Source/interpolate-json) [![node](https://img.shields.io/node/v/interpolate-json?logo=nodejs&style=plastic)](https://www.npmjs.com/package/interpolate-json) [![GitHub](https://img.shields.io/github/license/Terran-Source/interpolate-json?logo=github&style=plastic)](LICENSE) [![NPM version](https://img.shields.io/npm/v/interpolate-json.svg?style=plastic)](https://www.npmjs.com/package/interpolate-json)

## Install

```bash
# with npm
npm install interpolate-json

# or with Yarn
yarn add interpolate-json
```

## Usage

```javascript
// declare the varible at the beginning
const { expand } = require('interpolate-json');

// for Strings
let someString = "I want to be ${character} in ${business.type} by being a ${business.post}";
let values = {
  character: 'a Hero',
  business: { type: 'saving people', post: 'Doctor' }
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

// Json
let myJson = {
  port: '8080',
  server: 'www.example.com',
  user: 'abcd',
  password: 'P@ss#ord',
  url:
    'https://${user}:${= encodeURIComponent(${password}) =}@${server}:${port}'
};
console.log((expand(myJson)); // Look for values inside itself
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
  port: '8080',
  server: 'www.example.com',
  user: '${=${USER_NAME}.toLowerCase()=}',
  password: '${USER_PASSWORD}',
  url:
    'https://${user}:${= encodeURIComponent(${password}) =}@${server}:${port}'
};

console.log((expand(myJson));
// execute using: USER_NAME='John' USER_PASSWORD='P@ss#ord' node test-json.js
// output:
{
  "port": "8080",
  "server": "www.example.com",
  "user": "john",
  "password": "P@ss#ord",
  "url": "https://john:P%40ss%23ord@www.example.com:8080"
}

```

Notice that `${==}` notation. It's a cool way to use JavaScript expression (not expression<u>*s*</u>, just a single line) inside.