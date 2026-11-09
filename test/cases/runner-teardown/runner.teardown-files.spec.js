import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Runner } from 'gallinago';

describe('teardown additional files', function() {
  const output = new URL('./output/', import.meta.url);
  const source = new URL('../../fixtures/cli.js', import.meta.url);

  after(function() {
    fs.rmSync(output, { recursive: true, force: true });
  });

  describe('string paths', function() {
    it('should delete additional files and directories', async function() {
      const file = new URL('./cli.js', output);
      const directory = new URL('./nested/', output);

      fs.mkdirSync(directory, { recursive: true });
      fs.copyFileSync(source, file);
      fs.copyFileSync(source, new URL('./cli.js', directory));

      await new Runner().teardown([fileURLToPath(file), fileURLToPath(directory)]);

      assert.equal(fs.existsSync(file), false);
      assert.equal(fs.existsSync(directory), false);
    });
  });

  describe('URL paths', function() {
    it('should delete additional files and directories alongside string paths', async function() {
      const file = new URL('./cli.js', output);
      const directory = new URL('./nested/', output);
      const stringFile = new URL('./string-cli.js', output);

      fs.mkdirSync(directory, { recursive: true });
      fs.copyFileSync(source, file);
      fs.copyFileSync(source, stringFile);
      fs.copyFileSync(source, new URL('./cli.js', directory));

      await new Runner().teardown([
        file, directory, fileURLToPath(stringFile), new URL('./missing.js', output)
      ]);

      assert.equal(fs.existsSync(file), false);
      assert.equal(fs.existsSync(directory), false);
      assert.equal(fs.existsSync(stringFile), false);
    });
  });
});
