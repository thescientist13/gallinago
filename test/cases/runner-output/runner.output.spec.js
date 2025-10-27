import path from 'node:path';
import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { Runner } from '../../../src/index.js';

const fixturesPath = path.join(process.cwd(), 'test/fixtures');

describe('CLI Fixture with output handlers', function() {
  describe('std out', function() {
    it('should invoke the callback with the output', async function() {
      const onStdOutMock = mock.fn();
      const runner = new Runner();

      await runner.runCommand(
        `${fixturesPath}/cli-writes-to-stdout.js`,
        [],
        { onStdOut: onStdOutMock }
      );

      assert.deepEqual(
        onStdOutMock.mock.calls.flatMap((x) => x.arguments),
        ['test'],
      );
    });
  });
});
