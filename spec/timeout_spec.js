var assert = require('assert'),
    fs = require('fs'),
    net = require('net'),
    path = require('path'),
    assert = require('chai').assert,
    EverSocket = require('../index').EverSocket;


describe("EverSocket", function() {
  var port = 4999;
  var server;
  var socket;

  beforeEach(function() {
    server = net.createServer();
    server.listen(port);
    socket = new EverSocket({ type: 'tcp4', timeout: 10 });
  });
  
  afterEach(function() {
    try { socket.destroy(); } catch(e) {}
    try { server.close(); } catch(e) {}
  });
  
  it('should emit timeout', function(done) {
    server.on('connection', function(c) {
      var writes = 0;
      var interval = setInterval(function() {
        c.write('.');
        if (++writes >= 5) 
          clearInterval(interval);
      }, 5);
    });
    var data = '';
    socket.on('timeout', function() {
      assert.equal('.....', data);
      done();
    });
    socket.on('data', function(d) {
      data += d;
    })
    socket.connect(port);
  });
  
  it('should reconnect on timeout', function(done) {
    socket = new EverSocket({ type: 'tcp4', timeout: 10, reconnectOnTimeout: true, reconnectWait: 1 });
    server.on('connection', function(c) {
      var writes = 0;
      var interval = setInterval(function() {
        c.write('.');
        if (++writes >= 5) 
          clearInterval(interval);
      }, 5);
    });
    var data = '';
    socket.on('reconnect', function() {
      assert.equal('.....', data);
      done();
    });
    socket.on('data', function(d) {
      data += d;
    })
    socket.connect(port);
  });
  
});

