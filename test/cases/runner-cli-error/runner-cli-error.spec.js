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
import chaiAsPromised from 'chai-as-promised';
import path from 'path';
import { Runner } from '../../../src/index.js';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('CLI Error Handling', function() {

  describe('default options with incorrect binary path', function() {
    it('should throw an error that module cannot be found', async function() {
      const binPath = 'test/fixtures/cliiiiii.js';
      const runner = new Runner();
      await expect(runner.runCommand(binPath)).to.be.rejectedWith(
        `Error: Cannot find path ${binPath}`
      );
    });
  });

  describe('default options with relative path for rootDir', function() {
    it('should throw an error that rootDir is not absolute', async function() {
      const runner = new Runner();
      await expect(
        runner.setup('../../test/fixtures/cli.js')
      ).to.be.rejectedWith('Error: rootDir is not an absolute path');
    });
  });

  describe('handling (and bubbling) an exception from the child process', function() {
    it('should throw an error that this is child throwing (a Promise.reject)', async function() {
      const runner = new Runner();
      await expect(
        runner.runCommand(
          path.join(process.cwd(), 'test/fixtures/cli-promise-rejection.js'),
          null,
          { async: true }
        )
      ).to.be.rejectedWith(
        'Error: Child process throwing a Promise.reject to the parent.'
      );
    });
  });

});