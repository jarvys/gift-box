var express = require('express');
var morgan = require('morgan');
var bodyParser = require('body-parser');

var app = express();
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({extended: false}));

var phoneValidator = /^(13[0-9]|15[012356789]|18[0-9]|14[57])[0-9]{8}$/;
var router = express.Router();
router.post('/info', function(req, res) {
    console.log(req.body);
    if (!req.body.phone || !phoneValidator.test(req.body.phone)) {
        return res.json({
            code: 1001,
            msg: 'Phone number is invalid'
        });
    }

    res.json({
        code: 0
    });
});

app.use('/api', router);

var PORT = 9678;
app.listen(PORT, function() {
    console.log('listening on port', PORT);
});

