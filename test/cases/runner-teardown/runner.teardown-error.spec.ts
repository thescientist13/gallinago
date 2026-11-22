import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Runner } from 'gallinago';

describe('teardown errors', function() {
  it('should reject when a directory cannot be removed', async function() {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gallinago-teardown-'));
    const originalRemove = fs.rmSync;
    const originalLog = console.log;
    const failure = new Error('simulated removal failure');

    fs.rmSync = (target, options) => {
      if (target === directory) {
        throw failure;
      }
      return originalRemove(target, options);
    };
    console.log = () => {};

    try {
      const runner = new Runner();
      await assert.rejects(runner.teardown([directory]), (error) => {
        assert.equal(error, failure);
        return true;
      });
    } finally {
      fs.rmSync = originalRemove;
      console.log = originalLog;
      originalRemove(directory, { recursive: true, force: true });
    }
  });
});
