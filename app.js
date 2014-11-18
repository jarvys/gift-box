var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/gift');
var models = require('./models'),
    User = models.User,
    Region = models.Region,
    City = models.City,
    App = models.App,
    UserGift = models.UserGift,
    GiftLog = models.GiftLog,
    isPreferCity = models.isPreferCity;

var _ = require('underscore');
var async = require('async');
var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var utils = require('./utils');
var logger = require('tracer').console();

var app = express();
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({
    extended: false
}));


function validatePhone(phone) {
    var validator = /^(13[0-9]|15[012356789]|18[0-9]|14[57])[0-9]{8}$/;
    return _.isString(phone) && validator.test(phone);
}

var router = express.Router();
router.post('/info', function(req, res) {
    if (!req.body.province || !req.body.city) {
        return res.json({
            code: 1001,
            msg: 'Region info is invalid'
        });
    }

    if (!validatePhone(req.body.phone)) {
        return res.json({
            code: 1001,
            msg: 'Phone number is invalid'
        });
    }

    models.User.findOneAndUpdate({
        phone: req.body.phone
    }, {
        phone: req.body.phone,
        region: req.body.province,
        city: req.body.city
    }, {
        upsert: true
    }, function(err) {
        if (err) {
            return res.json({
                code: 1101,
                msg: 'fail to create or update user info'
            });
        } else {
            res.json({
                code: 0
            });
        }
    });
});

function taskError(err, code) {
    if (_.isString(err)) {
        var msg = err;
        err = new Error(msg);
        err.msg = msg;
    }
    err.code = code;
    return err;
}

var CODE_DB_ERROR = 0;
var CODE_TIMES_LIMIT = 1;
var CODE_USER_NOT_FOUND = 2;
var CODE_NO_GIFTS_LEFT = 3;
var CODE_NOT_LUCKY = 4;

function findUsersStep(userPhone, helperPhone) {
    return function(callback) {
        var _user, _helper;

        async.parallel([

            function(callback) {
                User.findOne({
                    phone: userPhone
                }, function(err, user) {
                    if (err) return callback(err);

                    _user = user;
                    callback(null);
                });
            },
            function(callback) {
                User.findOne({
                    phone: helperPhone
                }, function(err, helper) {
                    if (err) return callback(err);

                    _helper = helper;
                    callback(null);
                });
            }
        ], function(err) {
            if (err) return callback(taskError(err, CODE_DB_ERROR));

            if (!_user || !_helper) {
                return callback(taskError('user not found', CODE_USER_NOT_FOUND));
            }

            callback(null, _user, _helper);
        });
    };
}

function ensureTimes(user, helper, callback) {
    // ensure times < 2
    UserGift.times(user, helper, function(err, times) {
        if (err) return callback(taskError(err, CODE_DB_ERROR));

        if (times >= 1) {
            return callback(taskError('more than once, ' + times, CODE_TIMES_LIMIT));
        }


        UserGift.count({
            user: user.id
        }, function(err, count) {
            if (err) return callback(taskError(err, CODE_DB_ERROR));

            if (count >= 4) {
                return callback(taskError('more than 4 times, ' + count, CODE_TIMES_LIMIT));
            }

            return callback(null, user, helper);
        });
    });
}

function getAvailableGifts(user, helper, callback) {
    // get available gifts
    user.availableGifts(function(err, gifts) {
        if (err) return callback(taskError(err, CODE_DB_ERROR));

        logger.debug('available gifts,', gifts);
        if (gifts.length === 0) {
            return callback(taskError('no gifts left', CODE_NO_GIFTS_LEFT));
        }

        return callback(null, user, helper, gifts);
    });
}

function getProportion(user, helper, gifts, callback) {
    App.baseProportion(function(err, proportion) {
        if (err) return callback(taskError(err, CODE_DB_ERROR));
        callback(null, user, helper, gifts, proportion);
    });
}

function rollGift(user, helper, gifts, proportion, callback) {
    // roll gift
    var total = _.reduce(gifts, function(mem, gift) {
        return mem + gift.left;
    }, 0);

    if (isPreferCity(user.city)) {
        proportion = proportion * 2;
        console.log('in prefer city, proportion', proportion);
    }

    var limit = total / proportion;
    var pos = Math.floor(Math.random() * limit);
    logger.debug('roll_gift -> pos: %d, total: %d', pos, total);
    var giftGot;
    if (pos >= total) {
        //return callback(taskError('not lucky', CODE_NOT_LUCKY));
        giftGot = null;
    } else {
        var leftArr = _.map(gifts, function(gift) {
            return gift.left;
        });

        var index = utils.find(leftArr, total);
        giftGot = gifts[index];
    }

    UserGift.create({
        user: user.id,
        helper: helper.id,
        gift: giftGot ? giftGot.id : null,
        date: new Date()
    }, function(err) {
        if (err) return callback(taskError(err, CODE_DB_ERROR));

        callback(null, {
            usr: user,
            helper: helper,
            gift: giftGot
        });
    });
}

var queue = async.queue(function(task, callback) {
    async.waterfall([
        findUsersStep(task.phone, task.helper),
        ensureTimes,
        getAvailableGifts,
        getProportion,
        rollGift
    ], callback);
}, 1);

router.post('/open', function(req, res) {
    var phone = req.body.phone;
    var helper = req.body.helper;
    if (!validatePhone(phone) || !validatePhone(helper)) {
        return res.json({
            code: 1001,
            msg: 'Phone number is invalid'
        });
    }

    queue.push({
        phone: phone,
        helper: helper
    }, function(err, result) {
        if (err) {
            logger.error('open_result -> user: %s, helper: %s, result: %j',
                phone, helper, err);
        } else {
            logger.info('open_result -> user: %s, helper: %s, gift: %s',
                phone, helper, result.gift ? result.gift.slug : null);
        }

        var giftGot = err ? null : (result.gift ? result.gift.slug : null);
        return res.json({
            code: 0,
            result: giftGot
        });
    });
});

router.get('/regions', function(req, res) {
    Region.find({}, {}, function(err, regions) {
        if (err) {
            return res.json({
                code: 1201,
                msg: 'internal server error'
            });
        }

        async.mapSeries(regions, function(region, cb) {
            var item = {
                id: region.no,
                name: region.name
            };

            City.find({
                region: region.no
            }, {}, function(err, cities) {
                if (err) {
                    return cb(err);
                }

                item.cities = cities.map(function(city) {
                    return {
                        id: city.no,
                        name: city.name
                    };
                });
                cb(null, item);
            });
        }, function(err, items) {
            if (err) {
                return res.json({
                    code: 1201,
                    msg: 'internal server error'
                });
            }

            return res.json({
                code: 0,
                regions: items
            });
        });
    });
});

router.get('/records', function(req, res) {
    UserGift.find({})
        .populate('user')
        .populate('helper')
        .populate('gift')
        .exec(function(err, records) {
            if (err) {
                return res.json({
                    code: 1101,
                    msg: 'internal server error'
                });
            }

            res.json({
                code: 0,
                records: _.map(records, function(record) {
                    return {
                        phone: record.user.phone,
                        helperPhone: record.helper.phone,
                        gift: record.gift ? record.gift.slug : null
                    }
                })
            });
        });
});

router.get('/gifts', function(req, res) {
    if (!req.query.phone) {
        return res.json({
            code: 0,
            gifts: []
        });
    }

    User.findOne({
        phone: req.query.phone
    }, function(err, user) {
        if (err || !user) {
            if (err) logger.error(err);

            return res.json({
                code: 1101,
                msg: 'internal server error'
            });
        }

        logger.debug(user);
        UserGift.find({
            user: user.id
        }).populate('gift').exec(function(err, records) {
            if (err) logger.error(err);

            records = err ? [] : records;
            logger.debug(records);
            var giftsFromFriend = _.filter(records, function(record) {
                return !record.helper.equals(record.user);
            });
            giftsFromFriend = _.map(giftsFromFriend, function(record) {
                return record.gift ? record.gift.slug : null;
            });

            var mineGifts = _.filter(records, function(record) {
                return record.helper.equals(record.user);
            });
            var giftMine = mineGifts.length > 0 ? mineGifts[0] : null;
            var opened = giftMine !== null;
            giftMine = giftMine ? giftMine.gift : null;

            res.json({
                code: 0,
                gifts: giftsFromFriend,
                mine: giftMine ? giftMine.slug : null,
                opened: opened ? 1 : 0
            });

        });
    });
});

app.use('/api', router);
app.use(express.static(__dirname + '/public'));

var PORT = 9678;
app.listen(PORT, function() {
    console.log('listening on port', PORT);
});
