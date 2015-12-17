#!/usr/bin/env node

var fs = require('fs')
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multer = require('multer')
var WebSocketServer = require('ws').Server;

var phoneWebsockets = {};
var viewerWebsockets = {};

var app = express();

// RAW DATA CHECK:
// app.use (function (req, res, next) {
// 	var chunks = [];
// 	req.on('data', function (chunk) {
// 		chunks.push(chunk);
// 	});

// 	req.on('end', function () {
// 		var rawbody = Buffer.concat(chunks);
// 		console.log('RAW DATA');
// 		console.log(rawbody.toString('utf8'));
// 		console.log('END RAW DATA');
// 		next();
// 	});
// });

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');


//app.use(favicon(__dirname + '/public/favicon.ico')); // uncomment after placing your favicon in /public
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ dest: './public/uploads/'}))
app.use(cookieParser());
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function (req, res) {
	fs.readdir(__dirname + '/public/uploads/', function (err, files) {
		if(err) {
			res.send("foutje");
			return console.log(err);
		}
		console.log(files);
		res.render('index', { title: 'Selvie Testserver', uploads: files });
	});
});

app.get('/viewer', function (req, res) {
	res.render('viewer', { });
});


app.post('/test', function (req, res){
	console.log("req.body");
	console.log("==========");
	console.log(req.body);
	console.log("");
	console.log("FILES");
	console.log("==========");
	console.log(req.files);


	res.send("OK")
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


	// send video to viewer:

	sendToViewer(JSON.stringify({
		message: "video_uploaded",
		videopath: "/uploads/" + req.files.binarydata.name
	}));
});


// UGC Endpoints:
// ======================
app.post('/v1/metadata', function (req, res){
	console.log('collector got metadata: ', req.body);
	var client_id = req.body.client_id;
	var content_id = Date.now().toString(36); // simple id; current time converted to base36 -> unique for this server and for every phone

	// respond with content_id:
	res.json({
		status: 0,
		response: {
			content_id: content_id
		}
	});

	// request content over WS:
	sendContentRequestToPhone(client_id, content_id)
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
app.use(function (req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handler:
app.use(function (err, req, res, next) {
	if(!err.status) err.status = 500;

	res.status(err.status);

	if(err.status == 404)
		return res.send(err.toString()); // 404 errors are not worth logging.

	if (app.get('env') === 'production'){
		console.log(err.stack); // log to console
		return res.send("An error occured: " + err.status); // don't log to user
	} else {
		next(err); // log to console and user
	}
});


// Start webserver:
// ======================

var webserver = app.listen(app.get('port'), function() {
	console.log('Express server listening on port ' + webserver.address().port);
});


var wss = new WebSocketServer({server: webserver});


// Wireless Broker Websocket Endpoint:
// ======================
wss.on('connection', function (ws) {
	console.log('incoming websocket', ws.upgradeReq.url);

	switch(ws.upgradeReq.url) {
		case '/':
		phoneConnected(ws);
		break;

		case '/viewer':
		viewerConnected(ws);
		break;
	}
});


function phoneConnected (ws) {
	console.log('phone connected');

	ws.on('message', function (message) {
		var msg = JSON.parse(message);
		console.log('got message from socket', msg);

		if(msg.message == "device_registration") {

			var ip = getIpAddress();
			console.log("storing phone with client_id", msg.client_id);
			phoneWebsockets[msg.client_id] = ws;
			ws.client_id = msg.client_id; // to be able to delete the right websocket from the phoneWebsockets-Dictionary

			// replying to phone:
			ws.send(JSON.stringify({
				status: 0,
				message: "device_registration",
				response: {
					ugc: "http://" + ip + ":" + webserver.address().port,
					director: "http://" + ip + ":" + webserver.address().port
					// director: "http://192.168.1.101:3000"
				}
			}));

			return;
		}
	});

	ws.on('close', function(){
		delete phoneWebsockets[ws.client_id];
		console.log('phone disconnected');
	});
}


function sendContentRequestToPhone(client_id, content_id) {
	console.log('will send content_request in 100ms');
	setTimeout(function() {
		if(phoneWebsockets[client_id]) {
			// send content request
			console.log('sending content_request to', client_id, "for content_id", content_id);
			phoneWebsockets[client_id].send(JSON.stringify({
				message: "content_request",
				request_id: Math.floor(Math.random() * 1000000).toString(36), // generate request_id
				content_id: content_id,
				contentStartTime:  1420713891313,
				contentEndTime:  1420713891316,
				sendStartTime: 1420713891319,
				sendRate: "358.36"
			}));
		}
	}, 100);
}


function viewerConnected (ws) {
	console.log('viewer connected');

	// create random id for viewer socket:
	var viewer_id = 'viewer_id_' + Date.now();

	viewerWebsockets[viewer_id] = ws;
	ws.viewer_id = viewer_id

	ws.on('close', function(){
		delete viewerWebsockets[ws.viewer_id];
		console.log('viewer disconnected');
	});
}

function sendToViewer(message) {
	for (var viewer_id in viewerWebsockets) {
		viewerWebsockets[viewer_id].send(message);
	}
}

// webserver.address does not return the correct ip but 0.0.0.0
// we assume only 1 public ip; last match will win
function getIpAddress() {
	var os = require('os');
	var ifaces = os.networkInterfaces();
	var ip;
	Object.keys(ifaces).forEach(function (ifname) {

		ifaces[ifname].forEach(function (iface) {
			if ('IPv4' !== iface.family|| iface.internal !== false || ifname.indexOf('vbox') >= 0) {
				// skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses and vboxes
				return;
			}
			ip = iface.address;
		});
	});
	return ip;
}
