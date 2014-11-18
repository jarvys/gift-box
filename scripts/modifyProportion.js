var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/gift');

var _ = require('underscore');
var argv = require('minimist')(process.argv.slice(2));
var models = require('../models');
var App = models.App;

function warnExit(err) {
    console.error(err);
    return mongoose.connection.close();
}

if (_.isNumber(argv.proportion) && argv.proportion > 0 && argv.proportion < 1) {
    App.findOneAndUpdate({}, {
        $set: {
            proportion: argv.proportion
        }
    }, {
        upsert: true
    }, function(err) {
        if (err) {
            return warnExit(err);
        }

        console.log('Done!');
        return mongoose.connection.close();
    });
}

