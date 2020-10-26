/*
 * Use Case
 * Runs copy-dots by just passing a path to scan.
 *
 * Uaer Result
 * Should copy only dot files with no special filters
 *
 * User Command
 * copy-dots ../../some/path
 *
 * User Workspace
 * Default fixtures
 */
const expect = require('chai').expect;
const { add } = require('../src/index');

describe('Run some tests', function() {
     
  expect(add(1, 1)).to.be.equal(2);

});