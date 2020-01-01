const context = require('./test-setup');
const expect = require('chai').expect;

describe('#interpolation', function() {
  it("require('interpolate-json') should return correct instance of config", function() {
    // assert
    expect(context.interpolation).to.be.a('Interpolate-Json');
  });
});

describe('#interpolation.do(string)', function() {
  it('processed successfully', function() {
    // arrange
    const str = "Hi, my name is '${name}'. I'm ${age}";
    const values = { name: 'David', age: 18 };
    // act
    const result = context.interpolation.do(str, values);
    // assert
    console.log(`result:${result}`);
    expect(result).to.be.a('string');
    expect(result).to.be.equal(
      `Hi, my name is '${values.name}'. I'm ${values.age}`
    );
  });
  it('processed successfully with custom boundary', function() {
    // arrange
    const str = "Hi, my name is '{{name}}'. I'm {{age}}";
    const values = { name: 'David', age: 18 };
    const opt = { prefix: '{{', suffix: '}}' };
    // act
    const result = context.interpolation.do(str, values, opt);
    // assert
    console.log(`result:${result}`);
    expect(result).to.be.a('string');
    expect(result).to.be.equal(
      `Hi, my name is '${values.name}'. I'm ${values.age}`
    );
  });
  it('processed successfully with custom boundary & spaces', function() {
    // arrange
    const str = "Hi, my name is '{:   name :}'. I'm {:age      :}";
    const values = { name: 'David', age: 18 };
    const opt = { prefix: '{:', suffix: ':}' };
    // act
    const result = context.interpolation.do(str, values, opt);
    // assert
    console.log(`result:${result}`);
    expect(result).to.be.a('string');
    expect(result).to.be.equal(
      `Hi, my name is '${values.name}'. I'm ${values.age}`
    );
  });
  it('processed successfully with custom boundary(with space) & spaces', function() {
    // arrange
    const str = "Hi, my name is '{<!?#:   name :#?!>}'. I'm {<!?#:age   :#?!>}";
    const values = { name: 'David', age: 18 };
    const opt = { prefix: ' {<!?#:  ', suffix: ' :#?!>} ' };
    // act
    const result = context.interpolation.do(str, values, opt);
    // assert
    console.log(`result:${result}`);
    expect(result).to.be.a('string');
    expect(result).to.be.equal(
      `Hi, my name is '${values.name}'. I'm ${values.age}`
    );
  });
});
