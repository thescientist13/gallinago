/*
 * Use Case
 * Runs the CLI fixture that copies dot files from fixtures directory.  Based 
 * on copy-dots: https://github.com/thescientist13/copy-dots
 *
 * Uaer Result
 * Should succesfully catch the error from invalid binary path.
 * 
 * runCommand
 * runCommand('test/fixtures/cliiiii')
 *
 */
const expect = require('chai').expect;
const Runner = require('../../../src/index').Runner;

describe('CLI Error Handling', function() {

  describe('default options with incorrect binary path', function() {
    it('should throw an error that module cannot be found', async function() {
      try {
        const runner = new Runner();
        
        await runner.runCommand('test/fixtures/cliiiiii.js');
      } catch (err) {
        expect(err).to.contain('Error: Cannot find module ');
      }
    });
  });

  describe('default options with relative path for rootDir', function() {
    it('should throw an error that rootDir is not absolute', async function() {
      try {
        const runner = new Runner();
        await runner.setup('../../test/fixtures/cli.js');
      } catch (err) {
        console.debug(err);
        expect(err).to.contain('Error: rootDir is not an absolute path');
      }
    });
  });

});