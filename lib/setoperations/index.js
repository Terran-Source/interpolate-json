'use strict';

const union = (setA, setB) => {
  let _set = new Set(setA);
  for (let val of setB) _set.add(val);
  return _set;
};

const subtract = (setFrom, setVal) => {
  let _set = new Set(setFrom);
  for (let val of setVal) _set.delete(val);
  return _set;
};

module.exports = {
  union: union,
  subtract: subtract
};
