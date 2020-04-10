const context = require('./test-setup');
const expect = require('chai').expect;

describe('#interpolation.expand(String)', function () {
  it('processed successfully', function () {
    // arrange
    const str =
      "Hi, my name is '${name}'. I'm ${age}. I am ${education.degree} ${education.profession}.";
    const values = {
      name: 'David',
      age: 18,
      education: { degree: 'M.B.B.S', profession: 'Doctor' },
    };
    // act
    const result = context.interpolation.expand(str, values);
    // assert
    console.log(`result:${result}`);
    expect(result).to.be.a('string');
    expect(result).to.be.equal(
      `Hi, my name is '${values.name}'. I'm ${values.age}. I am ${values.education.degree} ${values.education.profession}.`
    );
  });
  it('processed successfully with plain string', function () {
    // arrange
    const str = "Hi, my name is 'David'. I'm 18";
    // act
    const result = context.interpolation.expand(str);
    // assert
    console.log(`result:${result}`);
    expect(result).to.be.a('string');
    expect(result).to.be.equal("Hi, my name is 'David'. I'm 18");
  });
  it('processed successfully with custom boundary', function () {
    // arrange
    const str =
      "Hi, my name is '{{name}}'. I'm {{age}}. I am {{education.degree}} {{education.profession}}.";
    const values = {
      name: 'David',
      age: 18,
      education: { degree: 'M.B.B.S', profession: 'Doctor' },
    };
    const opt = { prefix: '{{', suffix: '}}' };
    // act
    const result = context.interpolation.expand(str, values, opt);
    // assert
    console.log(`result:${result}`);
    expect(result).to.be.a('string');
    expect(result).to.be.equal(
      `Hi, my name is '${values.name}'. I'm ${values.age}. I am ${values.education.degree} ${values.education.profession}.`
    );
  });
  it('processed successfully with custom boundary & spaces', function () {
    // arrange
    const str =
      "Hi, my name is '{:   name :}'. I'm {:age      :}. I am {:education.degree:} {: education.profession :}.";
    const values = {
      name: 'David',
      age: 18,
      education: { degree: 'M.B.B.S', profession: 'Doctor' },
    };
    const opt = { prefix: '{:', suffix: ':}' };
    // act
    const result = context.interpolation.expand(str, values, opt);
    // assert
    console.log(`result:${result}`);
    expect(result).to.be.a('string');
    expect(result).to.be.equal(
      `Hi, my name is '${values.name}'. I'm ${values.age}. I am ${values.education.degree} ${values.education.profession}.`
    );
  });
  it('processed successfully with custom boundary(with space) & spaces', function () {
    // arrange
    const str =
      "Hi, my name is '{<!?#:   name :#?!>}'. I'm {<!?#:age   :#?!>}. I am {<!?#:education.degree:#?!>} {<!?#:education.profession:#?!>}.";
    const values = {
      name: 'David',
      age: 18,
      education: { degree: 'M.B.B.S', profession: 'Doctor' },
    };
    const opt = { prefix: ' {<!?#:  ', suffix: ' :#?!>} ' };
    // act
    const result = context.interpolation.expand(str, values, opt);
    // assert
    console.log(`result:${result}`);
    expect(result).to.be.a('string');
    expect(result).to.be.equal(
      `Hi, my name is '${values.name}'. I'm ${values.age}. I am ${values.education.degree} ${values.education.profession}.`
    );
  });
  it('processed successfully with custom boundary(with space), prefix only', function () {
    // arrange
    const str =
      "Hi, my name is '{<!?#:   name'. I'm {<!?#:age. I am {<!?#:education.degree {<!?#:education.profession. Url: http://bogus/{<!?#:urlId/dummy";
    const values = {
      name: 'David',
      age: 18,
      education: { degree: 'M.B.B.S', profession: 'Doctor' },
      urlId: 'KUFKJbs_kvkjsfkksvbs.fjs',
    };
    const opt = { prefix: ' {<!?#:  ' };
    // act
    const result = context.interpolation.expand(str, values, opt);
    // assert
    console.log(`result:${result}`);
    expect(result).to.be.a('string');
    expect(result).to.be.equal(
      `Hi, my name is '${values.name}'. I'm ${values.age}. I am ${values.education.degree} ${values.education.profession}. Url: http://bogus/${values.urlId}/dummy`
    );
  });
});
