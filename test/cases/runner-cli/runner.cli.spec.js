/*
 * Use Case
 * Runs the CLI fixture that copies dot files from fixtures directory.  Based
 * on copy-dots: https://github.com/thescientist13/copy-dots
 *
 * User Result
 * Should run cli.js runCommand successfully with setup, runCommand and teardown functions called
 *
 * runCommand
 * runCommand('test/fixtures/cli', 'test/fixtures')
 *
 */
import chai from 'chai';
import fs from 'fs-extra';
import path from 'path';
import { Runner } from '../../../src/index.js';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('CLI Fixture', function() {
  const outputPath = fileURLToPath(new URL('./output', import.meta.url));
  const fixturesPath = path.join(process.cwd(), 'test/fixtures');
  const setupFiles = [{
    source: path.join(process.cwd(), 'node_modules/@webcomponents/webcomponentsjs/webcomponents-bundle.js'),
    destination: path.join(outputPath, 'webcomponents-bundle.js')
  }];
  let runner;

  describe('default options with relative path', function() {
    before(async function() {
      runner = new Runner();
    });

    before(async function() {
      await runner.setup(outputPath);
      await runner.runCommand(
        `${fixturesPath}/cli.js`, // binPath
        fixturesPath // args
      );
    });

    it('should have created the output folder', function() {
      const exists = fs.existsSync(outputPath);

      expect(exists).to.be.equal(true);
    });

    it('should only copy 3 files', function() {
      const files = fs.readdirSync(outputPath);

      expect(files.length).to.be.equal(3);
    });

    it('should have an .editorconfig file', function() {
      expect(fs.existsSync(`${outputPath}/.editorconfig`)).to.be.equal(true);
    });

    it('should have an .eslintrc file', function() {
      expect(fs.existsSync(`${outputPath}/.eslintrc.cjs`)).to.be.equal(true);
    });

    it('should have .mocharc file', function() {
      expect(fs.existsSync(`${outputPath}/.mocharc.cjs`)).to.be.equal(true);
    });

    it('should delete the output directory when told', async function() {
      await runner.teardown([outputPath]);

      expect(fs.existsSync(outputPath)).to.be.equal(false);
    });
  });

  describe('setup with setupFiles', function() {
    before(async function() {
      runner = new Runner();
    });

    before(async function() {
      await runner.setup(outputPath, setupFiles);
      await runner.runCommand(
        `${fixturesPath}/cli.js`, // binPath
        fixturesPath // args
      );
    });

    it('should have created the output folder', function() {
      const exists = fs.existsSync(outputPath);

      expect(exists).to.be.equal(true);
    });

    it('should only copy 4 files', function() {
      const files = fs.readdirSync(outputPath);

      expect(files.length).to.be.equal(4);
    });

    it('should have an .editorconfig file', function() {
      expect(fs.existsSync(`${outputPath}/.editorconfig`)).to.be.equal(true);
    });

    it('should have an .eslintrc file', function() {
      expect(fs.existsSync(`${outputPath}/.eslintrc.cjs`)).to.be.equal(true);
    });

    it('should have .mocharc file', function() {
      expect(fs.existsSync(`${outputPath}/.mocharc.cjs`)).to.be.equal(true);
    });

    it('should have webcomponents-bundle.js file', function() {
      expect(fs.existsSync(`${outputPath}/webcomponents-bundle.js`)).to.be.equal(true);
    });

    it('should delete the setup file we provided', async function() {
      const setupFile = path.join(outputPath, 'webcomponents-bundle.js');
      await runner.teardown();

      expect(fs.existsSync(setupFile)).to.be.equal(false);
      expect(fs.existsSync(outputPath)).to.be.equal(true);

      // cleanup everything
      await runner.teardown([outputPath]);
      expect(fs.existsSync(outputPath)).to.be.equal(false);
    });
  });
});