'use strict';

var express = require('express'),
    _ = require('underscore'),
    app = express(),
    bodyParser = require('body-parser'),
    errorHandler = require('errorhandler'),
    methodOverride = require('method-override'),
    port = parseInt(process.env.PORT, 10) || 8080,
    publicDir = __dirname + '/public';

app.get('/', function(req, res) {
    res.redirect('/index.html');
});

app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(express.static(publicDir));

app.use(errorHandler({
    dumpExceptions: true,
    showStack: true
}));

app.use(app.router);

app.listen(port);

