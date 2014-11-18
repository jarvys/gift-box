var _ = require('underscore');
var async = require('async');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RegionSchema = Schema({
    no: {
        type: Number,
        unique: true
    },
    name: String
});
var Region = mongoose.model('Region', RegionSchema);

var CitySchema = Schema({
    no: {
        type: Number,
        unique: true
    },
    name: String,
    region: Number
});

var City = mongoose.model('City', CitySchema);

var UserSchema = Schema({
    phone: {
        type: String,
        unique: true
    },

    region: Number,
    city: Number
});

// TODO
var TARGET_CITIES = [];

UserSchema.methods.availableGifts = function(callback) {
    var self = this;
    Gift.allGifts(function(err, gifts) {
        if (err) return callback(err);

        gifts = _.filter(gifts, function(gift) {
            return gift.left > 0;
        });

        console.log(gifts);
        if (TARGET_CITIES.indexOf(self.city) === -1) {
            gifts = _.filter(gifts, function(gift) {
                return gift.slug !== 'yingrun';
            });
        }

        console.log(gifts);
        callback(null, gifts);
    });
};

var User = mongoose.model('User', UserSchema);

var GiftSchema = Schema({
    name: String,
    slug: {
        type: String,
        unique: true
    },
    total: Number,
    released: Number
});

GiftSchema.methods.left = function(callback) {
    var self = this;
    UserGift.count({
        gift: this.id
    }, function(err, count) {
        if (err) {
            return callback(err);
        }

        callback(null, self.released - count);
    });
};

GiftSchema.statics.allGifts = function(callback) {
    Gift.find({}, function(err, gifts) {
        if (err) return callback(err);

        async.mapSeries(gifts, function(gift, callback) {
            gift.left(function(err, left) {
                if (err) return callback(err);

                gift.left = left;
                callback(null, gift);
            });
        }, callback);
    });
};

var Gift = mongoose.model('Gift', GiftSchema);

var UserGiftSchema = Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },

    helper: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },

    gift: {
        type: Schema.Types.ObjectId,
        ref: 'Gift'
    },

    date: Date
});

UserGiftSchema.statics.times = function(user, helper, callback) {
    UserGift.count({
        user: user.id,
        helper: helper.id
    }, callback);
};

var UserGift = mongoose.model('UserGift', UserGiftSchema);

var GiftLogSchema = Schema({
    user: String,
    helper: String,
    gift: String,
    date: Date
});

var GiftLog = mongoose.model('GiftLog', GiftLogSchema);

var AppSchema = Schema({
    proportion: Number
});

AppSchema.statics.baseProportion = function(callback) {
    App.findOne({}, function(err, app) {
        if (err) return callback(err);

        console.log('app:', app);
        callback(null, app.proportion);
    });
};

var App = mongoose.model('App', AppSchema);

module.exports = {
    Region: Region,
    City: City,
    User: User,
    Gift: Gift,
    UserGift: UserGift,
    GiftLog: GiftLog,
    App: App
};
