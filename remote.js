var WebSocketServer = require('ws').Server
	, wss = new WebSocketServer({ port: 3001 });
wss.on('connection', function connection(ws) {
	ws.on('message', function incoming(message) {
		console.log('received: %s', message);
	});
});
function broadcast(data) {
	wss.clients.forEach(function each(client) {
	client.send(data);
	});
};

var stdin = process.openStdin();
stdin.on('data', function(data) {
	console.log("sending record toggle");
	broadcast(JSON.stringify({"toggleRecord": 1}));
});