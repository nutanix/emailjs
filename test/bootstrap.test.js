/**
 * Bootstrap the test suite.
 *
 * This file serves as the global manager for all test hooks which include,
 * the `before`, `beforeEach`, `after`, and `afterEach` methods. Since most
 * tests will likely require an active instance of the sails server, it's main
 * job is to lift an instance of the server and expose it to all test suites.
 * However, if there is anything else that needs to run globaly for all tests
 * then then that task can be added here as well.
 *
 * @see http://mochajs.org/#hooks
 *
 */
/*jshint strict:false */
/* global before,after*/

/**
 * Setup the test environment.
 */
before(function (done) {
  done();
});

/**
 * Teardown the test environment.
 */
after(function (done) {
  done();
});

