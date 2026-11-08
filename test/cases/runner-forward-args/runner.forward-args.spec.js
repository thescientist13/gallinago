/*
 * Use Case
 * Runs the CLI fixture and ensures that params from the parent process are passed down into the child process.
 *
 * User Result
 * Should run cli.js runCommand successfully and outputs the expected result.
 *
 * runCommand
 *
 * runner = new Runner(false, true);
 * runCommand('cli.js')
 *
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs-extra';
import path from 'node:path';
import { Runner } from '../../../src/index.js';
import { fileURLToPath, URL } from 'node:url';

describe('Forward Parent Args', function() {
  const currentPath = fileURLToPath(new URL('.', import.meta.url));
  const outputPath = fileURLToPath(new URL('./output', import.meta.url));

  describe('default options with forwardParentArgs set to true', function() {
    let runner;

    before(async function() {
      runner = new Runner(false, true);
      await runner.setup(outputPath);
      await runner.runCommand(
        path.join(currentPath, 'cli.js') // binPath
      );
    });

    it('should have created the output folder', function() {
      const exists = fs.existsSync(outputPath);

      assert.equal(exists, true);
    });

    it('should output a file for the expected content from forwarded parent args', function() {
      const exists = fs.existsSync(path.join(outputPath, 'args.txt'));

      assert.equal(exists, true);
    });

    it('should have the expected output for forwarded parent args', function() {
      const contents = fs.readFileSync(path.join(outputPath, 'args.txt'), 'utf-8');
      assert.deepEqual(JSON.parse(contents), process.execArgv);
    });

    after(async function() {
      await runner.teardown([
        path.join(outputPath)
      ]);
    });
  });
});