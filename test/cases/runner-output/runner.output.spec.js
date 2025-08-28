import path from 'node:path';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { Runner } from '../../../src/index.js';

const fixturesPath = path.join(process.cwd(), 'test/fixtures');

describe('CLI Fixture with output handlers', function() {
  describe('std out', function() {
    it('should return the buffered output', async function() {
      const runner = new Runner();

      await runner.runCommand(`${fixturesPath}/cli-writes-to-stdout.js`);

      const output = runner.getStdOut();
      const error = runner.getStdErr();

      assert.equal(output, 'test');
      assert.equal(error, '');
    });

    it('should invoke the callback with the output', async function() {
      const onStdOutMock = mock.fn();
      const runner = new Runner();
      runner.onStdOut(onStdOutMock);

      await runner.runCommand(`${fixturesPath}/cli-writes-to-stdout.js`);

      assert.deepEqual(
        onStdOutMock.mock.calls.flatMap((x) => x.arguments),
        ['test'],
      );
    });

    it('should invoke the callback with the replayed output', async function() {
      const onStdOutMock = mock.fn();
      const runner = new Runner();

      await runner.runCommand(`${fixturesPath}/cli-writes-to-stdout.js`);

      runner.onStdOut(onStdOutMock, { replay: true });

      assert.deepEqual(
        onStdOutMock.mock.calls.flatMap((x) => x.arguments),
        ['test'],
      );
    });
  });

  describe('std err', function() {
    it('should return the buffered output', async function() {
      const runner = new Runner();

      await runner.runCommand(`${fixturesPath}/cli-writes-to-stderr.js`);

      const output = runner.getStdOut();
      const error = runner.getStdErr();

      assert.equal(error, 'test err');
      assert.equal(output, '');
    });

    it('should invoke the callback with the output', async function() {
      const onStdErrMock = mock.fn();
      const runner = new Runner();
      runner.onStdErr(onStdErrMock);

      await runner.runCommand(`${fixturesPath}/cli-writes-to-stderr.js`);

      assert.deepEqual(
        onStdErrMock.mock.calls.flatMap((x) => x.arguments),
        ['test err'],
      );
    });

    it('should invoke the callback with the replayed output', async function() {
      const onStdErrMock = mock.fn();
      const runner = new Runner();

      await runner.runCommand(`${fixturesPath}/cli-writes-to-stderr.js`);

      runner.onStdErr(onStdErrMock, { replay: true });

      assert.deepEqual(
        onStdErrMock.mock.calls.flatMap((x) => x.arguments),
        ['test err'],
      );
    });
  });
});
