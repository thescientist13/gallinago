/*
 * Use Case
 * Make the projects pacakge.main exports the right interface
 *
 * Uaer Result
 * Should export the expected intertface
 *
 */
import chai from 'chai';
import { Runner } from '../../../src/index.js';
import { Runner as packageMainRunner } from '../../../src/index.js';

const expect = chai.expect;

describe('Package Main', function() {

  describe('Runner export from package.json main (index.js) should match Runner class export', function() {

    it('should be equal', function() {
      expect(packageMainRunner).to.be.equal(Runner);
    });

  });

});