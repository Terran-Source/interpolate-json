before(() => {
  // global arrange
  this.interpolation = require('../').interpolation;
});

beforeEach(() => {
  // global debug set to true
  this.interpolation.debug();
});

afterEach(() => {
  // global reset
  this.interpolation.debug(false);
});
