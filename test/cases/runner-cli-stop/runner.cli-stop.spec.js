/*
 * Use Case
 * Runs a CLI fixture that starts a (live reload) server with its own process.  This presents two issue
 * - the initial process will not close on its own
 * - any processes that it spawns wont be closed when killing the main process
 *
 * Uaer Result
 * Should run cli.js runCommand successfully with stop function called 
 * and correctly shuts down a live server
 *
 * runCommand
 * runCommand('test/fixtures/cli', 'test/fixtures')
 *
 */
const expect = require('chai').expect;
const http = require('http');
const path = require('path');
const Runner = require('../../../src/index').Runner;

describe('Server Fixture for Manual Process Stop', function() {
  const outputPath = path.join(__dirname, './output');
  const fixturesPath = path.join(process.cwd(), 'test/fixtures');
  let runner;
  
  before(function() {
    runner = new Runner(true);
  });

  describe('default behavior using runner.stopCommand', function() {

    before(async function() {
      await runner.setup(outputPath);

      return new Promise(async (resolve) => {
        setTimeout(() => {
          resolve();
        }, 5000);

        await runner.runCommand(
          `${fixturesPath}/server.js`
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

    it('should run without issue', function(done) {
      runner.stopCommand();
      done();
    });
  });

});