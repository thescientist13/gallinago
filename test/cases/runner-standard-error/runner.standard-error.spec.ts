import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { Runner } from 'gallinago';
import type { CommandError } from 'gallinago';

const fixturePath = path.join(process.cwd(), 'test/fixtures/cli-process-outcomes.ts');

describe('standard error callback', function() {
  it('should throw for a non-function stderr callback before spawning', function() {
    const runner = new Runner();

    assert.throws(
      // @ts-expect-error Exercise runtime validation of an invalid callback.
      () => runner.runCommand(fixturePath, { onStdErr: 'invalid' }),
      { name: 'TypeError', message: 'onStdErr must be passed a function or null' }
    );
    assert.equal(runner.childProcess, null);
  });

  it('should deliver stderr strings on success alongside stdout and console forwarding', async function() {
    const runner = new Runner({ enableStdOut: true });
    const stdout: string[] = [];
    const stderr: string[] = [];
    const log = mock.method(console, 'log', () => {});
    const error = mock.method(console, 'error', () => {});

    try {
      await runner.runCommand(fixturePath, {
        args: 'warning-success',
        onStdOut: (text) => stdout.push(text),
        onStdErr: (text) => {
          assert.equal(typeof text, 'string');
          stderr.push(text);
        }
      });

      assert.equal(stdout.join(''), 'ok\n');
      assert.equal(stderr.join(''), 'routine warning\n');
      assert.equal(log.mock.calls.flatMap((call) => call.arguments).join(''), stdout.join(''));
      assert.equal(error.mock.calls.flatMap((call) => call.arguments).join(''), stderr.join(''));
    } finally {
      log.mock.restore();
      error.mock.restore();
    }
  });

  it('should deliver stderr on failure without changing error diagnostics', async function() {
    const runner = new Runner();
    let stderr = '';

    await assert.rejects(runner.runCommand(fixturePath, {
      args: 'separate-streams',
      onStdErr: (text) => { stderr += text; }
    }), (error: CommandError) => {
      assert.equal(error.exitCode, 9);
      assert.equal(error.signal, null);
      assert.equal(error.stdout, 'useful output\n');
      assert.equal(error.stderr, 'incidental warning\n');
      assert.equal(stderr, error.stderr);
      assert.match(error.message, /stdout:\nuseful output\n\nstderr:\nincidental warning/);
      return true;
    });
  });
});
