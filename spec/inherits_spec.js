 var assert = require('assert'),
   fs = require('fs'),
   net = require('net'),
   path = require('path'),
   assert = require('chai').assert,
   util = require('util'),
   EverSocket = require('../index').EverSocket;


 describe("EverSocket", function() {
   var port = 4998;
   var server;
   var socket;

   beforeEach(function() {
     server = net.createServer();
     server.listen(port);

     var MySocket = function(config) {
       'use strict';
       EverSocket.call(this, {
         reconnectWait: 100,
         timeout: 100,
         reconnectOnTimeout: true
       });
     };
     util.inherits(MySocket, EverSocket);

     socket = new MySocket();
   });

   afterEach(function(done) {
     try {
       socket.destroy();
     } catch (e) {}
     try {
       server.close(function() {
         done();
       });

     } catch (e) {}
   });

   it('should connect if inherited', function(done) {
     socket.connect(4998, function() {
       done();
     });
   });
 });