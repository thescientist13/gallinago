import type { ChildProcessWithoutNullStreams } from 'node:child_process';
import { assertCommandError } from '../../helpers/command-error.ts';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { Runner } from 'gallinago';

const fixturePath = path.join(process.cwd(), 'test/fixtures/cli-process-outcomes.ts');

describe('process outcomes', function() {
  it('should reject a nonzero exit with empty stderr and include command context', async function() {
    const runner = new Runner();

    await assert.rejects(runner.runCommand(fixturePath, { args: 'exit-without-stderr' }), (error) => {
      assertCommandError(error);
      assertCommandError(error);
      assert.match(error.command, /cli-process-outcomes\.ts/);
      assert.equal(error.cwd, process.cwd());
      assert.equal(error.exitCode, 7);
      assert.equal(error.signal, null);
      assert.equal(error.stdout, 'last stdout\n');
      assert.equal(error.stderr, '');
      assert.match(error.message, /exited with code 7/);
      assert.match(error.message, /Working directory: /);
      assert.match(error.message, /stdout:\nlast stdout/);
      return true;
    });
  });

  it('should accept an exit code of zero even when stderr has a warning', async function() {
    const runner = new Runner();
    const output: string[] = [];

    await runner.runCommand(fixturePath, {
      args: 'warning-success',
      onStdOut: (text) => output.push(text)
    });

    assert.equal(output.join(''), 'ok\n');
  });

  it('should keep stdout and stderr separate on failure', async function() {
    const runner = new Runner();

    await assert.rejects(runner.runCommand(fixturePath, { args: 'separate-streams' }), (error) => {
      assertCommandError(error);
      assert.equal(error.exitCode, 9);
      assert.equal(error.stdout, 'useful output\n');
      assert.equal(error.stderr, 'incidental warning\n');
      assert.match(error.message, /stdout:\nuseful output\n\nstderr:\nincidental warning/);
      return true;
    });
  });

  it('should keep only the last 65,536 characters of stdout and stderr', async function() {
    const runner = new Runner();

    await assert.rejects(runner.runCommand(fixturePath, { args: 'large-output' }), (error) => {
      assertCommandError(error);
      assert.equal(error.exitCode, 2);
      assert.equal(error.stdout.length, 64 * 1024);
      assert.equal(error.stderr.length, 64 * 1024);
      assert.ok(error.stdout.endsWith('stdout tail\n'));
      assert.ok(error.stderr.endsWith('stderr tail\n'));
      return true;
    });
  });

  it('should reject when the child is terminated by a signal', async function() {
    const runner = new Runner();

    await assert.rejects(runner.runCommand(fixturePath, {
      args: 'wait-for-signal',
      onStdOut: (text) => {
        if (text.includes('ready')) {
          assert.ok(runner.childProcess);
          runner.childProcess.kill();
        }
      }
    }), (error) => {
      assertCommandError(error);
      assert.ok(error.signal);
      assert.equal(error.exitCode, null);
      assert.match(error.message, /terminated by signal/);
      return true;
    });
  });

  it('should reject a spawn failure with its cause and working directory', async function() {
    const runner = new Runner();
    const missingDirectory = path.join(os.tmpdir(), 'gallinago-missing-' + randomUUID());
    await runner.setup(missingDirectory, { create: false });

    await assert.rejects(runner.runCommand(fixturePath), (error) => {
      assertCommandError(error);
      assert.equal(error.cwd, missingDirectory);
      assert.equal(error.exitCode, null);
      assert.equal(error.signal, null);
      assert.ok(error.cause instanceof Error);
      assert.ok('code' in error.cause);
      assert.equal(error.cause.code, 'ENOENT');
      assert.match(error.message, /could not start/);
      return true;
    });
  });

  it('should reject an invalid spawn argument with its cause', async function() {
    const runner = new Runner();

    await assert.rejects(runner.runCommand(fixturePath, { args: ['\0'] }), (error) => {
      assertCommandError(error);
      assert.ok(error.cause instanceof Error);
      assert.equal(error.exitCode, null);
      assert.match(error.command, /cli-process-outcomes\.ts/);
      assert.equal(error.cwd, process.cwd());
      return true;
    });
  });
});

describe('stopCommand after process termination', function() {
  it('should return after a child has already exited', async function() {
    const runner = new Runner();
    await runner.runCommand(fixturePath, { args: 'warning-success' });
    assert.ok(runner.childProcess);
    runner.childProcess.kill = () => { throw new Error('already exited child was killed'); };

    await runner.stopCommand();
  });

  it('should reject when kill returns false and the child is still running', async function() {
    const runner = new Runner();
    const child = Object.assign(new EventEmitter(), { exitCode: null as number | null });
    Object.assign(child, { exitCode: null, signalCode: null, pid: 1234, kill: () => false });
    // This test double implements only the process members stopCommand uses.
    runner.childProcess = child as unknown as ChildProcessWithoutNullStreams;

    await assert.rejects(runner.stopCommand(), /Could not stop command with PID 1234/);
    assert.equal(child.listenerCount('exit'), 0);
    assert.equal(child.listenerCount('error'), 0);
  });

  it('should resolve when the child exits as kill returns false', async function() {
    const runner = new Runner();
    const child = Object.assign(new EventEmitter(), { exitCode: null as number | null });
    Object.assign(child, {
      exitCode: null,
      signalCode: null,
      kill: () => { child.exitCode = 0; return false; }
    });
    // This test double implements only the process members stopCommand uses.
    runner.childProcess = child as unknown as ChildProcessWithoutNullStreams;

    await runner.stopCommand();
  });

  it('should listen for exit before requesting termination', async function() {
    const runner = new Runner();
    const child = Object.assign(new EventEmitter(), { exitCode: null as number | null });
    Object.assign(child, {
      exitCode: null,
      signalCode: null,
      kill: () => { child.emit('exit'); return true; }
    });
    // This test double implements only the process members stopCommand uses.
    runner.childProcess = child as unknown as ChildProcessWithoutNullStreams;

    await runner.stopCommand();
  });

  it('should reject if kill throws', async function() {
    const runner = new Runner();
    const child = Object.assign(new EventEmitter(), { exitCode: null as number | null });
    Object.assign(child, {
      exitCode: null,
      signalCode: null,
      kill: () => { throw new Error('kill failed'); }
    });
    // This test double implements only the process members stopCommand uses.
    runner.childProcess = child as unknown as ChildProcessWithoutNullStreams;

    await assert.rejects(runner.stopCommand(), /kill failed/);
  });

  it('should reject if a child error follows a successful kill request', async function() {
    const runner = new Runner();
    const child = Object.assign(new EventEmitter(), { exitCode: null as number | null });
    Object.assign(child, {
      exitCode: null,
      signalCode: null,
      kill: () => { queueMicrotask(() => child.emit('error', new Error('child error'))); return true; }
    });
    // This test double implements only the process members stopCommand uses.
    runner.childProcess = child as unknown as ChildProcessWithoutNullStreams;

    await assert.rejects(runner.stopCommand(), /child error/);
  });
});
