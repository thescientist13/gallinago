/*
 * Use Case
 * Runs the CLI fixture that copies dot files from fixtures directory.  Based
 * on copy-dots: https://github.com/thescientist13/copy-dots
 *
 * User Result
 * Should run cli.js runCommand and test debug output
 *
 * runCommand
 * runCommand('test/fixtures/cli', 'test/fixtures')
 *
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs-extra';
import path from 'node:path';
import { Runner } from '../../../src/index.js';
import { fileURLToPath, URL } from 'node:url';

describe('CLI Fixture w/debug (stdOut) enabled', function() {
  const outputPath = fileURLToPath(new URL('./output', import.meta.url));
  const fixturesPath = path.join(process.cwd(), 'test/fixtures');

  it('should forward stdout and stderr to their matching console methods', async function() {
    const stdout = [];
    const stderr = [];
    const originalLog = console.log;
    const originalError = console.error;
    console.log = (text) => stdout.push(text);
    console.error = (text) => stderr.push(text);

    try {
      const runner = new Runner(true);
      await assert.rejects(runner.runCommand(`${fixturesPath}/cli-process-outcomes.js`, 'separate-streams'));
    } finally {
      console.log = originalLog;
      console.error = originalError;
    }

    assert.equal(stdout.join(''), 'useful output\n');
    assert.equal(stderr.join(''), 'incidental warning\n');
  });

  describe('default options with relative path', function() {
    let runner;

    before(async function() {
      runner = new Runner();
      await runner.setup(outputPath);
      await runner.runCommand(
        `${fixturesPath}/cli.js`, // binPath
        fixturesPath // args
      );
    });

    it('should have created the output folder', function() {
      const exists = fs.existsSync(outputPath);

      assert.equal(exists, true);
    });

    it('should only copy 3 files', function() {
      const files = fs.readdirSync(outputPath);

      assert.equal(files.length, 3);
    });

    it('should have an .editorconfig file', function() {
      assert.equal(fs.existsSync(`${outputPath}/.editorconfig`), true);
    });

    it('should have an .eslintrc file', function() {
      assert.equal(fs.existsSync(`${outputPath}/.eslintrc.cjs`), true);
    });

    it('should have .mocharc file', function() {
      assert.equal(fs.existsSync(`${outputPath}/.mocharc.cjs`), true);
    });

    after(async function() {
      await runner.teardown([
        path.join(outputPath)
      ]);
    });
  });
});