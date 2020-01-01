const chai = require('chai');

before(() => {
  // global arrange
  this.interpolation = require('../');
});

beforeEach(() => {
  // global reset
  this.interpolation.debug();
});

afterEach(() => {
  // global reset
  this.interpolation.reset();
});
