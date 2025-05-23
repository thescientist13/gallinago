/*
 * Use Case
 * Runs a CLI fixture that starts a (live reload) server with its own process.  This presents two issue
 * - the initial process will not close on its own
 * - any processes that it spawns wont be closed when killing the main process
 *
 * User Result
 * Should run cli.js runCommand successfully with stop function called
 * and correctly shuts down a live server
 *
 * runCommand
 * runCommand('test/fixtures/cli', 'test/fixtures')
 *
 */
import chai from 'chai';
import path from 'path';
import { Runner } from '../../../src/index.js';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Server Fixture for Manual Process Stop', function() {
  const outputPath = fileURLToPath(new URL('./output', import.meta.url));
  const fixturesPath = path.join(process.cwd(), 'test/fixtures');

  describe('default behavior using runner.stopCommand', function() {
    let runner;

    before(async function() {
      runner = new Runner();
      runner.setup(outputPath);

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 5000);

        runner.runCommand(
          `${fixturesPath}/server.js`,
          null,
          { async: true }
        );
      });
    });

    it('should start the server on port 8080', async function() {
      const response = await fetch('http://127.0.0.1:8080');

      expect(response.status).to.equal(200);
    });

    after(function() {
      runner.stopCommand();
    });
  });

  describe('should not error if calling runner.stopCommand with no active command running', function() {
    let runner;

    before(function() {
      runner = new Runner();
    });

    it('should run without issue', function() {
      runner.stopCommand();
    });

    after(function() {
      runner.teardown([
        path.join(outputPath)
      ]);
    });
  });

});