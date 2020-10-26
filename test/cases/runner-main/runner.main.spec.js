/*
 * Use Case
 * Make the projects pacakge.main exports the right interface
 *
 * Uaer Result
 * Should export the expected intertface
 * 
 */
const expect = require('chai').expect;
const Runner = require('../../../src/lib/runner');
const packageMainRunner = require('../../../src/index').Runner;

describe('Package Main', function() {

  describe('Runner export from package.json main (index.js) should match Runner class export', function() {

    it('should be equal', function() {     
      expect(packageMainRunner).to.be.equal(Runner);
    });

  });

});