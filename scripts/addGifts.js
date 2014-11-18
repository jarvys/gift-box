var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/gift');

var async = require('async');
var models = require('../models');
var Gift = models.Gift;

function warnExit(err) {
    console.error(err);
    return mongoose.connection.close();
}

async.each([{
    name: '遮瑕笔303',
    slug: 'zhexiabi303',
    total: 200,
    released: 0
}, {
    name: '水嫩凝肌粉笔液040号小样',
    slug: 'fenbiye040',
    total: 90,
    released: 0
}, {
    name: '香水',
    slug: 'perfume',
    total: 3,
    released: 0
}, {
    name: '单色眼影',
    slug: 'yanying',
    total: 50,
    released: 0
}, {
    name: '双效盈润粉液小样',
    slug: 'yingrun',
    total: 3000,
    released: 0
}], function(gift, callback) {
    Gift.create(gift, callback)
}, function(err) {
    if (err) {
        return warnExit(err);
    }

    console.log('Done!');
    return mongoose.connection.close();
});

