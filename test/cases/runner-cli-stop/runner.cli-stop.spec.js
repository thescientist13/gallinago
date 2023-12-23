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
import http from 'http';
import path from 'path';
import { Runner } from '../../../src/index.js';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Server Fixture for Manual Process Stop', function() {
  const outputPath = fileURLToPath(new URL('./output', import.meta.url));
  const fixturesPath = path.join(process.cwd(), 'test/fixtures');
  let runner;

  describe('default behavior using runner.stopCommand', function() {
    before(function() {
      runner = new Runner(true);
    });

    before(async function() {
      await runner.setup(outputPath);

      return new Promise(async (resolve) => {
        setTimeout(() => {
          resolve();
        }, 5000);

        await runner.runCommand(
          `${fixturesPath}/server.js`,
          '',
          { async: true }
        );
      });
    });

    it('should start the server on port 8080', function(done) {
      http.get('http://localhost:8080', function (resp) {
        expect(resp.statusCode).to.equal(200);
        done();
      });
    });

    after(function() {
      runner.stopCommand();
    });
  });

  describe('should not error if calling runner.stopCommand with no active command running', function() {
    before(function() {
      runner = new Runner(true);
    });

    it('should run without issue', function(done) {
      runner.stopCommand();
      done();
    });
  });

});