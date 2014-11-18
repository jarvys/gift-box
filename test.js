var assert = require('assert');
var utils = require('./utils');

describe('#utils.find', function() {
    it('should return 0', function() {
        assert.equal(utils.find([1, 2, 3], 1), 0);
    });

    it('should return 1', function() {
        assert.equal(utils.find([1, 2, 3], 2), 1);
        assert.equal(utils.find([1, 2, 3], 3), 1);
    });

    it('should return 2', function() {
        assert.equal(utils.find([1, 2, 3], 6), 2);
    });
});
