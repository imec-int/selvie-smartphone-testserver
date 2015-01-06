var App = function (options){

	var socket;

	var init = function (){
		console.log("init");
		initSocket();
	};

	var initSocket = function (){
		if(socket) return; // already initialized

		socket = io.connect(window.location.hostname);

		// some debugging statements concerning socket.io
		socket.on('reconnecting', function(seconds){
			console.log('reconnecting in ' + seconds + ' seconds');
		});
		socket.on('reconnect', function(){
			console.log('reconnected');
		});
		socket.on('reconnect_failed', function(){
			console.log('failed to reconnect');
		});
		socket.on('connect', function() {
			console.log('socket connected');
		});
	};

	return {
		init: init
	};
};



$(function(){
	var app = new App();
	app.init();
});

