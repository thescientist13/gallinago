import path from 'node:path';
import assert from 'node:assert/strict';
import { mock, describe, it } from 'node:test';
import { Runner } from 'gallinago';

const fixturesPath = path.join(process.cwd(), 'test/fixtures');

describe('CLI Fixture with standard output handlers', function() {
  describe('std out', function() {
    it('should throw for a non-function stdout callback before spawning', function() {
      const runner = new Runner();

      assert.throws(
        // @ts-expect-error Exercise runtime validation of an invalid callback.
        () => runner.runCommand(`${fixturesPath}/cli-writes-to-stdout.ts`, { onStdOut: 'invalid' }),
        { name: 'TypeError', message: 'onStdOut must be passed a function or null' }
      );
      assert.equal(runner.childProcess, null);
    });

    it('should invoke the callback with the output', async function() {
      const onStdOutMock = mock.fn();
      const runner = new Runner();

      await runner.runCommand(
        `${fixturesPath}/cli-writes-to-stdout.ts`,
        { onStdOut: onStdOutMock }
      );

      assert.deepEqual(
        onStdOutMock.mock.calls.flatMap((x) => x.arguments),
        ['test'],
      );
    });
  });
});
