import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Runner } from 'gallinago';

describe('URL paths', function() {
  describe('URL working directory and script', function() {
    const output = new URL('./output/', import.meta.url);
    const script = new URL('../../fixtures/cli-writes-file.ts', import.meta.url);
    const runner = new Runner();

    before(async function() {
      await runner.setup(output);
      await runner.runCommand(script, { args: ['hello world'] });
    });

    after(async function() {
      await runner.teardown([new URL('./output/', import.meta.url)]);
    });

    it('should write a file in the URL working directory', function() {
      assert.equal(fs.readFileSync(new URL('./message.txt', output), 'utf8'), 'hello world');
    });
  });

  describe('missing script URLs', function() {
    it('should reject a missing URL script with its filesystem path', async function() {
      const script = new URL('./missing.ts', import.meta.url);

      await assert.rejects(new Runner().runCommand(script), {
        message: `Error: Cannot find path ${fileURLToPath(script)}`
      });
    });
  });

  describe('non-file URLs', function() {
    it('should reject non-file URLs', async function() {
      const url = new URL('https://example.com/cli.js');
      const runner = new Runner();

      await assert.rejects(runner.setup(url), TypeError);
      await assert.rejects(runner.runCommand(url), TypeError);
      assert.equal(runner.childProcess, null);
    });
  });
});
