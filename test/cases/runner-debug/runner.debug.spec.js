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
import chai from 'chai';
import fs from 'fs-extra';
import path from 'path';
import { Runner } from '../../../src/index.js';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('CLI Fixture w/debug (stdOut) enabled', function() {
  const outputPath = fileURLToPath(new URL('./output', import.meta.url));
  const fixturesPath = path.join(process.cwd(), 'test/fixtures');

  describe('default options with relative path', function() {
    let runner;

    before(function() {
      runner = new Runner();
      runner.setup(outputPath, null, { create: true });
      runner.runCommand(
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

    after(function() {
      runner.teardown();
    });
  });
});