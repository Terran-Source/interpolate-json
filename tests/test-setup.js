before(() => {
  // global arrange
  this.interpolation = require('../');
});

beforeEach(() => {
  // global debug set to true
  this.interpolation.debug();
});

afterEach(() => {
  // global reset
  this.interpolation.reset();
});
