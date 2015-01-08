var App = function (options){

	var init = function (){
		console.log("init");
	};

	return {
		init: init
	};
};



$(function(){
	var app = new App();
	app.init();
});

