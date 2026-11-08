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
import { Runner } from '../../../src/index.js';
import { Runner as packageMainRunner } from '../../../src/index.js';

describe('Package Main', function() {

  describe('Runner export from package.json main (index.js) should match Runner class export', function() {

    it('should be equal', function() {
      assert.equal(packageMainRunner, Runner);
    });

  });

});