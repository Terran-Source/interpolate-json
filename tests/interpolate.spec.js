const context = require('./test-setup');
const expect = require('chai').expect;

describe('#interpolation', function() {
  it("require('interpolate-json') should return correct instance of config", function() {
    // assert
    expect(context.interpolation).to.be.a('Interpolate-Json');
  });
});
