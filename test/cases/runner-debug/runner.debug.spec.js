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
const rimraf = require('rimraf');
const Runner = require('../../../src/index').Runner;

describe('CLI Fixture w/debug (stdOut) enabled', function() {
  let runner;
  let basePath;

  before(async function() {
    await fs.mkdir(path.join(__dirname, './output'));

    basePath = path.join(__dirname, './output');
    runner = new Runner(true);

    await runner.setup(basePath);
  });

  describe('default options with relative path', function() {
    before(async function() {
      await runner.runCommand(
        'test/fixtures/cli.js', // binPath
        path.join(process.cwd(), './test/fixtures') // args
      );
    });

    it('should only copy 3 files', function() {
      const files = fs.readdirSync(basePath);
     
      expect(files.length).to.be.equal(3);
    });

    it('should have an .editorconfig file', function() {
      expect(fs.existsSync(`${basePath}/.editorconfig`)).to.be.equal(true);
    });

    it('should have an .eslintrc file', function() {
      expect(fs.existsSync(`${basePath}/.eslintrc.js`)).to.be.equal(true);
    });

    it('should have .mocharc.js file', function() {
      expect(fs.existsSync(`${basePath}/.mocharc.js`)).to.be.equal(true);
    });
  });

  after(function() {
    // bed.teardown();
    rimraf.sync(basePath);
  });
});