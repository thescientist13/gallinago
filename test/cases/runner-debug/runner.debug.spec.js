/*
 * Use Case
 * Runs the CLI fixture that copies dot files from fixtures directory.  Based 
 * on copy-dots: https://github.com/thescientist13/copy-dots
 *
 * Uaer Result
 * Should run cli.js runCommand and test debug output
 * 
 * runCommand
 * runCommand('test/fixtures/cli', 'test/fixtures')
 *
 */
const expect = require('chai').expect;
const fs = require('fs-extra');
const path = require('path');
const Runner = require('../../../src/index').Runner;

describe('CLI Fixture w/debug (stdOut) enabled', function() {
  const outputPath = path.join(__dirname, './output');
  const fixturesPath = path.join(process.cwd(), 'test/fixtures');
  let runner;

  before(async function() {
    runner = new Runner(true);
  });

  describe('default options with relative path', function() {
    before(async function() {
      await runner.setup(outputPath);
      await runner.runCommand(
        `${fixturesPath}/cli.js`, // binPath
        fixturesPath // args
      );
    });

    it('should have created the output folder', function() {
      const exists = fs.existsSync(outputPath);

      expect(exists).to.be.equal(true);
    });
    
    it('should only copy 3 files', function() {
      const files = fs.readdirSync(outputPath);
     
      expect(files.length).to.be.equal(3);
    });

    it('should have an .editorconfig file', function() {
      expect(fs.existsSync(`${outputPath}/.editorconfig`)).to.be.equal(true);
    });

    it('should have an .eslintrc file', function() {
      expect(fs.existsSync(`${outputPath}/.eslintrc.js`)).to.be.equal(true);
    });

    it('should have .mocharc.js file', function() {
      expect(fs.existsSync(`${outputPath}/.mocharc.js`)).to.be.equal(true);
    });
  });

  after(async function() {
    await runner.teardown();
  });
});