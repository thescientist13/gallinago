/*
 * Use Case
 * Make the projects pacakge.main exports the right interface
 *
 * User Result
 * Should export the expected intertface
 *
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Runner } from '../../../dist/lib/runner.js';
import { Runner as packageMainRunner } from 'gallinago';

describe('Package Main', function() {

  describe('Runner export from package.json main (index.js) should match Runner class export', function() {

    it('should be equal', function() {
      assert.equal(packageMainRunner, Runner);
    });

  });

});