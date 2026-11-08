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
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { Runner } from '../../../src/index.js';

describe('CLI Error Handling', function() {

  it('should reject an invalid output callback without requiring arguments', function() {
    const runner = new Runner();

    assert.throws(() => runner.runCommand('unused.js', { onStdOut: 'invalid' }), {
      name: 'TypeError',
      message: 'onStdOut must be passed a function or null'
    });
  });

  describe('default options with incorrect binary path', function() {
    it('should throw an error that module cannot be found', async function() {
      const binPath = 'test/fixtures/cliiiiii.js';
      const runner = new Runner();
      await assert.rejects(runner.runCommand(binPath), { message: `Error: Cannot find path ${binPath}` }
      );
    });
  });

  describe('default options with relative path for rootDir', function() {
    it('should throw an error that rootDir is not absolute', async function() {
      const runner = new Runner();
      await assert.rejects(
        runner.setup('../../test/fixtures/cli.js'),
        (error) => error === 'Error: rootDir is not an absolute path'
      );
    });
  });

  describe('handling (and bubbling) an exception from the child process', function() {
    it('should throw an error that this is child throwing (a Promise.reject)', async function() {
      const runner = new Runner();
      await assert.rejects(
        runner.runCommand(
          path.join(process.cwd(), 'test/fixtures/cli-promise-rejection.js')
        ),
        (error) => {
          assert.ok(error instanceof Error);
          assert.notEqual(error.exitCode, 0);
          assert.match(error.stderr, /Error: Child process throwing a Promise\.reject to the parent\./);
          assert.ok(error.message.includes(error.stderr));
          return true;
        }
      );
    });
  });

});