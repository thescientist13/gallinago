/*
 * Use Case
 * Runs the CLI fixture and ensures that params from the parent process are passed down into the child process.
 *
 * User Result
 * Should run cli.js runCommand successfully and outputs the expected result.
 *
 * runCommand
 * 
 * runner = new Runner(true, true);
 * runCommand('cli.js')
 *
 */
import chai from 'chai';
import fs from 'fs-extra';
import path from 'path';
import { Runner } from '../../../src/index.js';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Forward Parent Args', function() {
  const currentPath = fileURLToPath(new URL('.', import.meta.url));
  const outputPath = fileURLToPath(new URL('./output', import.meta.url));
  let runner;

  describe('default options with Forward Parent Args set to true', function() {
    before(function() {
      runner = new Runner(true, true);
    });

    before(function() {
      runner.setup(outputPath);
      runner.runCommand(
        path.join(currentPath, 'cli.js') // binPath
      );
    });

    it('should have created the output folder', function() {
      const exists = fs.existsSync(outputPath);

      expect(exists).to.be.equal(true);
    });

    it('should output a file for the expected content from forwarded parent args', function() {
      const exists = fs.existsSync(path.join(outputPath, 'args.txt'));

      expect(exists).to.be.equal(true);
    });

    it('should have the expected debug output for forwarded parent args', function() {
      const contents = fs.readFileSync(path.join(outputPath, 'args.txt'), 'utf-8');

      expect(contents).to.be.equal('--debug-port=3333');
    });

    after(async function() {
      await runner.teardown([
        path.join(outputPath, 'args.txt')
      ]);
    });
  });
});