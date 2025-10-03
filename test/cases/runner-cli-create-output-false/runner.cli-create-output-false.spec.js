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
import chai from 'chai';
import fs from 'fs-extra';
import { Runner } from '../../../src/index.js';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('CLI Fixture', function() {
  const outputPath = fileURLToPath(new URL('./output/', import.meta.url));

  describe('default options with relative path that should not create the output dir', function() {
    let runner;

    before(async function() {
      runner = new Runner();
      await runner.setup(outputPath, null, { create: false });
    });

    it('should have created the output folder', function() {
      const exists = fs.existsSync(outputPath);

      expect(exists).to.be.equal(false);
    });
  });
});
