import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Runner } from 'gallinago';

describe('setup files', function() {
  const source = new URL('../../fixtures/cli.js', import.meta.url);

  describe('string paths', function() {
    const output = new URL('./output-strings/', import.meta.url);
    const destination = new URL('./nested/cli.js', output);
    const runner = new Runner();

    before(async function() {
      await runner.setup(fileURLToPath(output), {
        setupFiles: [{
          source: fileURLToPath(source),
          destination: fileURLToPath(destination)
        }]
      });
    });

    after(async function() {
      await runner.teardown([fileURLToPath(output)]);
    });

    it('should copy the fixture into a nested directory', function() {
      assert.equal(fs.readFileSync(destination, 'utf8'), fs.readFileSync(source, 'utf8'));
    });

    it('should delete the setup file during teardown', async function() {
      await runner.teardown();

      assert.equal(fs.existsSync(destination), false);
      assert.equal(fs.existsSync(source), true);
    });
  });

  describe('URL paths', function() {
    const output = new URL('./output-urls/', import.meta.url);
    // test that the destination path is properly decoded when it contains encoded characters
    const destination = new URL('./nested café %23%25/cli.js', output);
    const runner = new Runner();

    before(async function() {
      await runner.setup(fileURLToPath(output), {
        setupFiles: [{ source, destination }]
      });
    });

    after(async function() {
      await runner.teardown([fileURLToPath(output)]);
    });

    it('should copy the fixture into a directory with encoded characters', function() {
      const destinationPath = fileURLToPath(output) + 'nested café #%/cli.js';

      assert.equal(fs.readFileSync(destinationPath, 'utf8'), fs.readFileSync(source, 'utf8'));
    });

    it('should delete the setup file during teardown', async function() {
      await runner.teardown();

      assert.equal(fs.existsSync(destination), false);
      assert.equal(fs.existsSync(source), true);
    });
  });
});
