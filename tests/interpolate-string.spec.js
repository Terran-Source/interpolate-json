const context = require('./test-setup');
const expect = require('chai').expect;

describe('#interpolation.do(String)', function() {
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
  it('processed successfully with plain string', function() {
    // arrange
    const str = "Hi, my name is 'David'. I'm 18";
    // act
    const result = context.interpolation.do(str);
    // assert
    console.log(`result:${result}`);
    expect(result).to.be.a('string');
    expect(result).to.be.equal("Hi, my name is 'David'. I'm 18");
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
  it('processed successfully with custom boundary(with space), prefix only', function() {
    // arrange
    const str =
      //                          without suffix ->| |<- mind the gap before dot (.)
      "Hi, my name is '{<!?#:   name'. I'm {<!?#:age . Url: http://bogus/{<!?#:urlId/dummy";
    const values = {
      name: 'David',
      age: 18,
      urlId: 'KUFKJbs_kvkjsfkksvbs.fjs'
    };
    const opt = { prefix: ' {<!?#:  ' };
    // act
    const result = context.interpolation.do(str, values, opt);
    // assert
    console.log(`result:${result}`);
    expect(result).to.be.a('string');
    expect(result).to.be.equal(
      `Hi, my name is '${values.name}'. I'm ${values.age}. Url: http://bogus/${values.urlId}/dummy`
    );
  });
});
