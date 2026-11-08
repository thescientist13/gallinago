/*
 * Use Case
 * Runs the CLI fixture that copies dot files from fixtures directory.  Based
 * on copy-dots: https://github.com/thescientist13/copy-dots
 *
 * User Result
 * Should run cli.js runCommand successfully with setup, runCommand and teardown functions called
 *
 * runCommand
 * runCommand('test/fixtures/cli', { args: 'test/fixtures' })
 *
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs-extra';
import path from 'node:path';
import { Runner } from '../../../src/index.js';
import { fileURLToPath, URL } from 'node:url';

describe('CLI Fixture', function() {
  const outputPath = fileURLToPath(new URL('./output/', import.meta.url));
  const fixturesPath = path.join(process.cwd(), 'test/fixtures');
  const setupFiles = [{
    source: path.join(process.cwd(), 'node_modules/@webcomponents/webcomponentsjs/webcomponents-bundle.js'),
    destination: path.join(outputPath, 'webcomponents-bundle.js')
  }];

  describe('default options with relative path', function() {
    let runner;

    before(async function() {
      runner = new Runner();
      await runner.setup(outputPath);
      await runner.runCommand(
        `${fixturesPath}/cli.js`, // binPath
        { args: fixturesPath } // options
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

    it('should delete the output directory when told', function() {
      runner.teardown([outputPath]);

      assert.equal(fs.existsSync(outputPath), false);
    });
  });

  describe('setup with setupFiles', function() {
    let runner;

    before(async function() {
      runner = new Runner();
      await runner.setup(outputPath, { setupFiles });
      await runner.runCommand(
        `${fixturesPath}/cli.js`, // binPath
        { args: fixturesPath } // options
      );
    });

    it('should have created the output folder', function() {
      const exists = fs.existsSync(outputPath);

      assert.equal(exists, true);
    });

    it('should only copy 4 files', function() {
      const files = fs.readdirSync(outputPath);

      assert.equal(files.length, 4);
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

    it('should have webcomponents-bundle.js file', function() {
      assert.equal(fs.existsSync(`${outputPath}/webcomponents-bundle.js`), true);
    });

    it('should delete the setup file we provided', async function() {
      const setupFile = path.join(outputPath, 'webcomponents-bundle.js');
      await runner.teardown();

      assert.equal(fs.existsSync(setupFile), false);
      assert.equal(fs.existsSync(outputPath), true);

      // cleanup everything
      await runner.teardown([outputPath]);
      assert.equal(fs.existsSync(outputPath), false);
    });
  });
});