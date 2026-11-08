/*
 * Use Case
 * Runs the CLI fixture that copies dot files from fixtures directory.  Based
 * on copy-dots: https://github.com/thescientist13/copy-dots
 *
 * User Result
 * Should run cli.js runCommand successfully with setup and not creating the output directory.
 *
 * runCommand
 * runCommand('test/fixtures/cli', 'test/fixtures')
 *
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs-extra';
import { Runner } from '../../../src/index.js';
import { fileURLToPath, URL } from 'url';

describe('CLI Fixture', function() {
  const outputPath = fileURLToPath(new URL('./output/', import.meta.url));

  describe('default options with relative path that should not create the output dir', function() {
    let runner;

    before(async function() {
      runner = new Runner();
      await runner.setup(outputPath, [], { create: false });
    });

    it('should have created the output folder', function() {
      const exists = fs.existsSync(outputPath);

      assert.equal(exists, false);
    });
  });
});