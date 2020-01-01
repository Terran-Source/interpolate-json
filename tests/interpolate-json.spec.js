const context = require('./test-setup');
const expect = require('chai').expect;
const fs = require('fs');
const path = require('path');

const parse = (filePath, encoding) => {
  return !filePath ? {} : JSON.parse(fs.readFileSync(filePath, encoding));
};

describe('#interpolation.do(JSON)', function() {
  it('processed successfully', function() {
    // arrange
    const json = parse(path.resolve('config.json'), 'utf8');
    // act
    const result = context.interpolation.do(json);
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
        ` ${result.DOES_NOT_EXIST || ''}`
    );
  });
  it('processed successfully with override values', function() {
    // arrange
    const json = parse(path.resolve('config.json'), 'utf8');
    const overrideVal = { ENV_VALUE: 'ENV_VALUE' };
    // act
    const result = context.interpolation.do(json, overrideVal);
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
        ` ${result.DOES_NOT_EXIST || ''}`
    );
  });
});
