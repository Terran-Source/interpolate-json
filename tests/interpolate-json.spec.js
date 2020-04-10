const context = require('./test-setup');
const expect = require('chai').expect;
const fs = require('fs');
const path = require('path');

const parse = (filePath, encoding) => {
  return !filePath ? {} : JSON.parse(fs.readFileSync(filePath, encoding));
};

describe('#interpolation.expand(JSON)', function () {
  it('processed successfully', function () {
    // arrange
    const json = parse(path.resolve('config.json'), 'utf8');
    // act
    const result = context.interpolation.expand(json);
    // assert
    console.log(`result:${JSON.stringify(result, null, 2)}`);
    expect(result).to.be.a('Object');
    expect(result.baseKey).to.be.equal(result.key);
    expect(result.subKey.baseKey).to.be.equal(result.key);
    expect(result.ENV_VALUE).to.be.equal(json.ENV_VALUE);
    expect(result.envKey).to.be.equal(result.ENV_VALUE);
    expect(result.subKey.envKey).to.be.equal(`subEnv_${result.ENV_VALUE}`);
    expect(result.complex).to.be.equal(
      `I have both ${result.key} &` +
        ` ${result.ENV_VALUE} & ${result.subKey.envKey} &` +
        ` ${result.subKey.deepSubKey.envKey} & ${result.DOES_NOT_EXIST || ''}`
    );
  });
  it('processed successfully with override values', function () {
    // arrange
    const json = parse(path.resolve('config.json'), 'utf8');
    const overrideVal = { ENV_VALUE: 'ENV_VALUE' };
    // act
    const result = context.interpolation.expand(json, overrideVal);
    // assert
    console.log(`result:${JSON.stringify(result, null, 2)}`);
    expect(result).to.be.a('Object');
    expect(result.baseKey).to.be.equal(result.key);
    expect(result.subKey.baseKey).to.be.equal(result.key);
    expect(result.ENV_VALUE).to.be.equal(json.ENV_VALUE);
    //expect(result.ENV_VALUE).to.be.equal(overrideVal.ENV_VALUE); // need discussion
    expect(result.envKey).to.be.equal(overrideVal.ENV_VALUE);
    expect(result.subKey.envKey).to.be.equal(`subEnv_${overrideVal.ENV_VALUE}`);
    expect(result.complex).to.be.equal(
      `I have both ${result.key} &` +
        ` ${overrideVal.ENV_VALUE} & ${result.subKey.envKey} &` +
        ` ${result.subKey.deepSubKey.envKey} & ${result.DOES_NOT_EXIST || ''}`
    );
  });
  it("processed successfully with override values (custom subKeyPointer: '#')", function () {
    // arrange
    const json = parse(path.resolve('config.#.json'), 'utf8');
    const overrideVal = { ENV_VALUE: 'ENV_VALUE' };
    const options = { subKeyPointer: '#' };
    // act
    const result = context.interpolation.expand(json, overrideVal, options);
    // assert
    console.log(`result:${JSON.stringify(result, null, 2)}`);
    expect(result).to.be.a('Object');
    expect(result.baseKey).to.be.equal(result.key);
    expect(result.subKey.baseKey).to.be.equal(result.key);
    expect(result.ENV_VALUE).to.be.equal(json.ENV_VALUE);
    //expect(result.ENV_VALUE).to.be.equal(overrideVal.ENV_VALUE); // need discussion
    expect(result.envKey).to.be.equal(overrideVal.ENV_VALUE);
    expect(result.subKey.envKey).to.be.equal(`subEnv_${overrideVal.ENV_VALUE}`);
    expect(result.complex).to.be.equal(
      `I have both ${result.key} &` +
        ` ${overrideVal.ENV_VALUE} & ${result.subKey.envKey} &` +
        ` ${result.subKey.deepSubKey.envKey} & ${result.DOES_NOT_EXIST || ''}`
    );
  });
  it("processed successfully with override values (custom prefix: '{{', suffix: '}}', subKeyPointer: '::')", function () {
    // arrange
    const json = parse(path.resolve('config.custom.json'), 'utf8');
    const overrideVal = { ENV_VALUE: 'ENV_VALUE' };
    const options = { prefix: '{{', suffix: '}}', subKeyPointer: '::' };
    // act
    const result = context.interpolation.expand(json, overrideVal, options);
    // assert
    console.log(`result:${JSON.stringify(result, null, 2)}`);
    expect(result).to.be.a('Object');
    expect(result.baseKey).to.be.equal(result.key);
    expect(result.subKey.baseKey).to.be.equal(result.key);
    expect(result.ENV_VALUE).to.be.equal(json.ENV_VALUE);
    //expect(result.ENV_VALUE).to.be.equal(overrideVal.ENV_VALUE); // need discussion
    expect(result.envKey).to.be.equal(overrideVal.ENV_VALUE);
    expect(result.subKey.envKey).to.be.equal(`subEnv_${overrideVal.ENV_VALUE}`);
    expect(result.complex).to.be.equal(
      `I have both ${result.key} &` +
        ` ${overrideVal.ENV_VALUE} & ${result.subKey.envKey} &` +
        ` ${result.subKey.deepSubKey.envKey} & ${result.DOES_NOT_EXIST || ''}`
    );
  });
  it('processed successfully with plain json', function () {
    // arrange
    const json = parse(path.resolve('config.plain.json'), 'utf8');
    // act
    const result = context.interpolation.expand(json);
    // assert
    console.log(`result:${JSON.stringify(result, null, 2)}`);
    expect(result).to.be.a('Object');
    expect(result).to.deep.equal(json);
  });
  it('processed successfully with plain json with Extra Environment Variables', function () {
    // arrange
    const json = parse(path.resolve('config.plain.json'), 'utf8');
    // act
    const result = context.interpolation.expand(json, process.env);
    // assert
    console.log(`result:${JSON.stringify(result, null, 2)}`);
    expect(result).to.be.a('Object');
    expect(result).to.deep.equal(json);
  });
});
