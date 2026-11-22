import assert from 'node:assert/strict';
import type { CommandError } from 'gallinago';

export function assertCommandError(error: unknown): asserts error is CommandError {
  assert.ok(error instanceof Error);
  for (const field of ['command', 'cwd', 'stdout', 'stderr'] as const) {
    assert.ok(field in error);
    assert.equal(typeof Reflect.get(error, field), 'string');
  }
  assert.ok('exitCode' in error && (error.exitCode === null || typeof error.exitCode === 'number'));
  assert.ok('signal' in error && (error.signal === null || typeof error.signal === 'string'));
}
