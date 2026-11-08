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
 * runCommand('test/fixtures/cli', { args: 'test/fixtures' })
 *
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { Runner } from '../../../src/index.js';
import { fileURLToPath, URL } from 'node:url';

describe('Server Fixture for Manual Process Stop', function() {
  const outputPath = fileURLToPath(new URL('./output', import.meta.url));
  const fixturesPath = path.join(process.cwd(), 'test/fixtures');

  describe('default behavior using runner.stopCommand', function() {
    let runner;

    before(async function() {
      runner = new Runner();
      await new Promise((resolve, reject) => {
        const onStdOut = (message) => {
          if (message.includes('server started on port 8080')) {
            resolve();
          }
        };
        runner.setup(outputPath).then(() =>
          runner.runCommand(
            `${fixturesPath}/server.js`,
            { onStdOut }
          ).catch(reject)
        )
      });
    });

    it('should start the server on port 8080', async function() {
      const response = await fetch('http://127.0.0.1:8080');

      assert.equal(response.status, 200);
    });

    after(async function() {
      await runner.stopCommand();
    });
  });

  describe('should not error if calling runner.stopCommand with no active command running', function() {
    let runner;

    before(function() {
      runner = new Runner();
    });

    it('should run without issue', async function() {
      await runner.stopCommand();
    });

    after(async function() {
      await runner.teardown([
        path.join(outputPath)
      ]);
    });
  });

});