## 2.1.4
- package upgrade

## 2.1.3
- package upgrade

## 2.1.2
- exporting `RegexEscaped` with main

## 2.1.1
- polished gulp
- upgraded packages

## 2.1.0
- travis - test twice (before minification & after)
- deploy on minimum node version upgrade
- travis change to add latest
- node minimum version update

## 2.0.4
- upgrade package
- Bump lodash from 4.17.15 to 4.17.19

## 2.0.3
- minor rename & documentation update

## 2.0.2
- Fixing #3
- Regex sticky mess

## 2.0.1
- fix non debug typo
- extra tests

## 2.0.0
#### Changes
- declaration syntax.
  ```javascript
  // declare the variable at the beginning
  const interpolation = require('interpolate-json').interpolation;
  // or
  const { interpolation } = require('interpolate-json');
  ```
- removed `reset()`
- `suffix` is mandatory if function expression is used.
- `subKeyPointer` is restricted to dot(`.`), hash(`#`), underscore(`_`) & colon(`:`) (or it's multiple, like: `::` etc)
- `funcSpecifier` is fixed to equal(`=`)
- `escapeSpecifier` is fixed to star(`*`)
- improved coding standards

## 1.0.0
- first major release :)

#### Declaration
```javascript
// declare the variable at the beginning
const interpolation = require('interpolate-json');
```

#### string interpolation
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

#### json interpolation
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
