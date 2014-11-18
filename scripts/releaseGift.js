var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/gift');

var _ = require('underscore');
var argv = require('minimist')(process.argv.slice(2));
var models = require('../models');
var Gift = models.Gift;


if (!_.isString(argv.slug) || !_.isNumber(argv.increment) || argv.increment < 0) {
    return console.error('invalid parameter');
}

function warnExit(err) {
    console.error(err);
    return mongoose.connection.close();
}

Gift.findOneAndUpdate({
    slug: argv.slug
}, {
    $inc: {
        released: argv.increment
    }
}, function(err, gift) {
    if (err) {
        return warnExit(err);
    }

    if (!gift) {
        return warnExit(new Error('no gift found'));
    }

    console.log('Done!', gift);
    return mongoose.connection.close();
});
