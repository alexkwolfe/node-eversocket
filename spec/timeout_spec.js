var assert = require('assert'),
    fs = require('fs'),
    net = require('net'),
    path = require('path'),
    assert = require('chai').assert,
    EverSocket = require('../index').EverSocket;


describe("EverSocket", function() {
  var port = 4999;
  var server;

  beforeEach(function(done) {
    server = net.createServer();
    server.listen(port, done);
  });
  
  afterEach(function(done) {
    server.close(function() {
      server = null;
      done();
    });
  });

  it('should emit reconnect on timeout', function(done) {
    var reconnected = false;
    var socket = new EverSocket({ type: 'tcp4', timeout: 10, reconnectOnTimeout: true, reconnectWait: 1 });

    server.once('connection', function(c) {
      setTimeout(function() {
        assert.isTrue(reconnected);
        c.end();
      }, 20);
    });

    socket.once('close', function() {
      done();
    });

    socket.once('reconnect', function() {
      reconnected = true;
    });
    socket.connect(port);
  });

  it('should continue reconnecting on timeout', function(done) {
    var timeoutCount = 0;
    var socket = new EverSocket({ type: 'tcp4', timeout: 10, reconnectOnTimeout: true, reconnectWait: 1 });

    server.on('connection', function(c) {
      setTimeout(function() {
        c.end();
      }, 20);
    });

    socket.on('reconnect', function() {
      if (timeoutCount === 3)
        done();
    });

    socket.on('timeout', function() {
      timeoutCount++;
    });

    socket.connect(port);
  });
});

