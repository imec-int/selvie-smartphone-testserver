var Viewer = function (options) {

	var websocket = null;
	var nrOfVideos = 0;
	var videos = [];

	var init = function (){
		connectWebsocket()
	};

	var connectWebsocket = function (){
		websocket = new WebSocket("ws://" + location.host + '/viewer');
		websocket.onopen = function (evt) {
			console.log("websocket connected");
		};

		websocket.onerror = function (evt) {
			console.log("websocket error:", evt.data);
		};

		websocket.onclose = function(evt) {
			// reconnect on close
			setTimeout(connectWebsocket, 5000);
		};

		websocket.onmessage = function(event) {
			// console.log(event.data);
			incomingSocketData(JSON.parse(event.data));
		};

	};

	var incomingSocketData = function (data) {
		console.log(data);

		switch(data.message) {
			case "video_uploaded":
			addVideo(data);
			break;
		}
	};


	var addVideo = function (video) {
		var $videoEl = $("#video-tmpl").tmpl(video);
		$videoEl.addClass('video');
		$(".content").append($videoEl);

		// save video
		var videoObj = {$el: $videoEl, playstate: 'playing'};
		videos.push(videoObj);
		updateVideoCssBasedOnNumberOfVideos();

		var videoEl = $videoEl[0];
		videoEl.onended = function(e) {
			videoObj.playstate = 'ended';
			cleanUpVideos();
		};

		execWhenReady(videoEl, function () {
			videoEl.play();
		});
	};

	var execWhenReady = function (videoEl, someFunction) {
		var self = this;
		$(videoEl).off();
		if(videoEl.readyState != 4) {
			$(videoEl).one('canplay', function () {
				someFunction.apply(self);
			});
		}else{
			someFunction.apply(self);
		}
	};

	var cleanUpVideos = function () {
		for (var i = 0; i < videos.length - 1; i++) {
			if(videos[i].playstate == 'ended') {
				var videoObj = videos[i];

				videoObj.$el.fadeOut(300, function () {
					videoObj.$el.remove();
					videoObj.playstate = 'removed';
					updateVideoCssBasedOnNumberOfVideos();
				});
			}
		};
	};

	var updateVideoCssBasedOnNumberOfVideos = function () {
		var nrOfVideos = 0;

		for (var i = 0; i < videos.length; i++) {
			if(videos[i].playstate == 'removed') continue;
			nrOfVideos++;
		};

		if(nrOfVideos != 0) {// should not happen
			$("body").width(); // force css update hack
			$('.video').css('width', 100/nrOfVideos+'%');
		}
	};

	return {
		init: init
	};
};





