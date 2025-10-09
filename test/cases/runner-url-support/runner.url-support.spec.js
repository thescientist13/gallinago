/*
 * Use Case
 * Runs the CLI fixture with URL objects for source and destination paths.
 *
 * User Result
 * Should successfully handle URL objects in setupFiles
 *
 */
import chai from 'chai';
import fs from 'fs-extra';
import path from 'path';
import { Runner } from '../../../src/index.js';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('CLI Fixture with URL support', function() {
  const outputPath = fileURLToPath(new URL('./output/', import.meta.url));
  const fixturesPath = path.join(process.cwd(), 'test/fixtures');
  const setupFiles = [{
    source: new URL('../../../node_modules/@webcomponents/webcomponentsjs/webcomponents-bundle.js', import.meta.url),
    destination: new URL('./output/webcomponents-bundle.js', import.meta.url)
  }];

  describe('setup with URL objects in setupFiles', function() {
    let runner;

    before(async function() {
      runner = new Runner();
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

    it('should delete the setup file we provided', function() {
      runner.teardown();

      expect(fs.existsSync(`${outputPath}/webcomponents-bundle.js`)).to.be.equal(false);
    });

    after(function() {
      runner.teardown([outputPath]);
    });
  });
});
