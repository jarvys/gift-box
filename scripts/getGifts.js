var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/gift');

var _ = require('underscore');
var async = require('async');
var argv = require('minimist')(process.argv.slice(2));
var models = require('../models');
var Gift = models.Gift,
    UserGift = models.UserGift;

function warnExit(err) {
    console.error(err);
    return mongoose.connection.close();
}

Gift.find({}, function(err, gifts) {
    if (err) {
        return warnExit(err);
    }

    async.mapSeries(gifts, function(gift, callback) {
        gift.left(function(err, left) {
            if (err) return callback(err);

            var result = _.extend({}, gift.toObject(), {
                left: left
            });
            callback(null, result);
        });
    }, function(err, gifts) {
        if (err) {
            return warnExit(err);
        }

        console.log(gifts);
        return mongoose.connection.close();
    });
});
