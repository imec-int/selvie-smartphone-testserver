#!/usr/bin/env node

var net = require('net');

net.createServer(function (socket) {

  console.log('socket connected:', socket.remoteAddress + ":" + socket.remotePort);

  socket.on('data', function (data) {
    console.log(data.toString());
  });

  socket.on('end', function () {
    console.log('socket disconnected');
  });

}).listen(3000);
