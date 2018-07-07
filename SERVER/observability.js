
var fs = require('fs');
var express = require('express');
var authToken = 'cm9vdDpHZXJtYW55MQ==';

module.exports = function(app, config, connection, logger, recentData, runningLog){

	//	-----------------------------------------------------------------------------
	//	Deliver the base template of SPA
	//	-----------------------------------------------------------------------------
	app.get('/', function (req, res){
		authenticate(req,
			function(user){
				if (isset(user.error))
					res.redirect('/sign-in');
				else
					res.send(loadTemplatePart('base.html'));
			});
	});

	app.get('/sign-in', function (req, res){
		if (isset(req.headers.authorization) && req.headers.authorization.substring(0, 6) == 'Basic '){
			if (req.headers.authorization.split(' ')[1] == authToken){
				res.redirect('/');
				return false;
			}
		}
		logger.log(req.headers);
		res.statusCode = 401;
		res.setHeader('WWW-Authenticate', 'Basic realm="TaskRunner"');
		res.end('Auth Required');
	});

	app.get('/nodes', function (req, res){
		authenticate(req,
			function(user){
				if (isset(user.error))
					res.send({'error': 'auth-required'});
				else
					res.send({'nodes': Object.keys(recentData)});
			});
	});

	app.get('/node/:id', function (req, res){
		authenticate(req,
			function(user){
				if (isset(user.error))
					res.send({'error': 'auth-required'});
				else
					res.send({'data': recentData[ req.params.id ]});
			});
	});

	//	-----------------------------------------------------------------------------
	//	Deliver static assets
	//	-----------------------------------------------------------------------------
	app.use('/assets', express.static('assets'));

};


//	-----------------------------------------------------------------------------
//	Process HTTP request header - Authenticate the access token on
//	-----------------------------------------------------------------------------
function authenticate(req, callback){
	if (isset(req.headers.authorization) && req.headers.authorization.substring(0, 6) == 'Basic ' && req.headers.authorization.split(' ')[1] == authToken)
		callback({username: 'root'});
	else
		callback({error: 'no-authentication-header'});
}

//	-----------------------------------------------------------------------------
//	Get the plain-text content of a file in templates
//	-----------------------------------------------------------------------------
function loadTemplatePart(template){
	try{
		return fs.readFileSync('./templates/'+template, 'utf8');
	}
	catch(e){
		return '<h2>Page Not Found</h2>';
	}
}

function isset(obj) {
	return (typeof obj != 'undefined');
}
