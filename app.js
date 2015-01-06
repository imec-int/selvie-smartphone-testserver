#!/usr/bin/env node

var express = require('express');
var http = require('http')
var path = require('path');
var socketio = require('socket.io');
var utils = require('./utils');

var app = express();

app.configure(function(){
	app.set('port', process.env.PORT || 3000);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser('selvietestserver123456789987654321'));
	app.use(express.session());
	app.use(app.router);
	app.use(require('stylus').middleware(__dirname + '/public'));
	app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
	app.use(express.errorHandler());
});

var webserver = http.createServer(app).listen(app.get('port'), function(){
	console.log("Express server listening on port " + app.get('port'));
});

// Socket IO
var io = socketio.listen(webserver);

io.sockets.on('connection', function (socket) {
	console.log('socket connected');
	setTimeout(function () {
		console.log('sending ping');
		socket.emit('ping', {data: 'stuff'});
	},5000);


	socket.on('pong', function () {
		console.log('got pong from socket');
		setTimeout(function () {
			console.log('sending ping')
			// socket.emit('ping', {data: 'stuff'});
		},1000);
	});
});


app.get('/', function (req, res){
	res.render('index', { title: 'Hello World' });
});

app.post('/api/test', function (req, res){
	console.log('got post', req.body);
	res.send('thx');
});

app.get('/api/people', function (req, res){
	console.log('got people request', req.body);
	res.json([
		{
			firstname: 'Sam',
			lastname: 'Decrock'
		},
		{
			firstname: 'Matthias',
			lastname: 'Dedinges'
		}
	]);
});






