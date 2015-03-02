#!/usr/bin/env node

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multer = require('multer')
var WebSocketServer = require('ws').Server;

var app = express();

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


//app.use(favicon(__dirname + '/public/favicon.ico')); // uncomment after placing your favicon in /public
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ dest: './uploads/'}))
app.use(cookieParser());
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
	res.render('index', { title: 'Express' });
});


// Director Endpoints:
// ======================
app.post('/v1/content', function (req, res){
	console.log("METADATA");
	console.log("==========");
	var metadata = JSON.parse(req.body.metadata);
	console.log(metadata);
	console.log("got content from ", metadata.client_id);
	console.log("");
	console.log("FILES");
	console.log("==========");
	console.log(req.files);


	res.json({status: 0});
});


// UGC Endpoints:
// ======================
app.post('/v1/metadata', function (req, res){
	console.log('collector got metadata from: ', req.body.client_id);
	var uniqueId = Date.now().toString(36); // simple id; current time converted to base36 -> unique for this server and for every phone
	res.json({
		status: 0,
		response: {
			content_id: uniqueId
		}
	});
});

app.put('/v1/sample/:content_id', function (req, res){
	console.log('got sample update with content_id:', req.params.content_id);
	res.json({status: 0});
});


// Wireless Broker Endpoints:
// ======================

app.put('/v1/device/parameter/:client_id/', function (req, res){
	console.log('got device parameters from', req.params.client_id, req.body);
	res.json({status: 0});
});




// Error routers:
// ======================

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
				message: err.message,
				error: err
		});
		console.log(err);
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});


var webserver = app.listen(app.get('port'), function() {
	console.log('Express server listening on port ' + webserver.address().port);
});


var wss = new WebSocketServer({server: webserver});

// Websocket Endpoint:
// ======================
wss.on('connection', function (ws) {
	var opened = true;
	console.log('socket connected');
	// setTimeout(function () {
	// 	if(!opened) return;

	// 	console.log('sending content_request');
	// 	ws.send(JSON.stringify(
	// 		{
	// 			// message: "device_reconfig",
	// 			// commands: ["sdd", "jdjd"]
	// 			message: "content_request",
	// 			request_id: "rid",
	// 			content_id: "coid",
	// 			contentStartTime:  1420713891313,
	// 			contentEndTime:  1420713891316,
	// 			sendStartTime: 1420713891319,
	// 			sendRate: 358.36
	// 		})
	// 	);
	// },5000);


	ws.on('message', function (message) {
		console.log('got message from socket');
		console.log(message);
		var msg = JSON.parse(message);
		if(msg.message == "device_registration"){
			var ip = getIpAddress();
			ws.send(JSON.stringify({
			status: 0,
			message: "device_registration",
			response: {
				ugc: "http://" + ip + ":" + webserver.address().port
			}
		}));
		}
	});

	ws.on('close', function(){
		console.log('closed connection');
		opened = false;
	});
});

// webserver.address does not return the correct ip but 0.0.0.0
// we assume only 1 public ip; last match will win
function getIpAddress() {
	var os = require('os');
	var ifaces = os.networkInterfaces();
	var ip;
	Object.keys(ifaces).forEach(function (ifname) {

		ifaces[ifname].forEach(function (iface) {
			if ('IPv4' !== iface.family|| iface.internal !== false) {
				// skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
				return;
			}
			ip = iface.address;
		});
	});
	return ip;
}
