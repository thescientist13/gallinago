/*
 * Use Case
 * Runs the CLI fixture that copies dot files from fixtures directory.  Based
 * on copy-dots: https://github.com/thescientist13/copy-dots
 *
 * User Result
 * Should succesfully catch the error from invalid binary path.
 *
 * runCommand
 * runCommand('test/fixtures/cliiiii')
 *
 */
import chai from 'chai';
import path from 'path';
import { Runner } from '../../../src/index.js';

const expect = chai.expect;

describe('CLI Error Handling', function() {

  describe('default options with incorrect binary path', function() {
    it('should throw an error that module cannot be found', function() {
      const binPath = 'test/fixtures/cliiiiii.js';

      try {
        const runner = new Runner();

        runner.runCommand(binPath);
      } catch (err) {
        expect(err).to.equal(`Error: Cannot find path ${binPath}`);
      }
    });
  });

  describe('default options with relative path for rootDir', function() {
    it('should throw an error that rootDir is not absolute', function() {
      try {
        const runner = new Runner();
        runner.setup('../../test/fixtures/cli.js');
      } catch (err) {
        console.debug(err);
        expect(err).to.contain('Error: rootDir is not an absolute path');
      }
    });
  });

  describe('handling (and bubbling) an exception from the child process', function() {
    it('should throw an error that this is child throwing (a Promise.reject)', function() {
      try {
        const runner = new Runner();
        runner.setup(path.join(process.cwd(), 'test/fixtures/cli-promise-rejection.js'));
      } catch (err) {
        console.debug(err);
        expect(err).to.contain('Error: Child process throwing a Promise.reject to the parent.');
      }
    });
  });

});