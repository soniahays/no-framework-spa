'use strict';

var express = require('express'),
	_ = require('lodash'),
	app = express(),
	bodyParser = require('body-parser'),
	errorHandler = require('errorhandler'),
	methodOverride = require('method-override'),
	port = parseInt(process.env.PORT, 10) || 8080,
	publicDir = __dirname + '/public';

var cache = {};
var product = require(publicDir + '/product.json');

app.get('/', function(req, res) {
	res.redirect('/index.html');
});

app.get('/specs', function(req, res) {
	if(cache.specs !== null && typeof cache.specs !== 'undefined') {
		res.json(cache.specs);
	} else {
		var specs = [];
		var specsObjects = _.pluck(product, 'specs');

		specsObjects.forEach(function(specsObject) {
			var currentSpecs = Object.keys(specsObject);
			currentSpecs.forEach(function (currentSpec) {
				if (specs.indexOf(currentSpec) === -1) {
					specs.push(currentSpec);
				}
			});
		});

		cache.specs = specs;
		res.json(cache.specs);
	}
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

