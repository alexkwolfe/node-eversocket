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
    socket = new EverSocket({ type: 'tcp4' })
  });
  
  afterEach(function() {
    try { socket.destroy(); } catch(e) {}
    try { server.close(); } catch(e) {}
  });
  
  it('should connect', function(done) {
    var connected = false;
    server.on('connection', function() {
      connected = true;
    });
    socket.on('connect', function() {
      setTimeout(function() {
        assert.isTrue(connected);
        done();
      }, 10);
    })
    socket.connect(port);
  });
  
  it('should reconnect', function(done) {
    var reconnected = false;
    
    server.on('connection', function() {
      // socket connected for the first time
      server.once('close', function() {
        // recreate the connection
        server = net.createServer();
        server.once('connection', function(x) {
          // socket has reconnected
          reconnected = true;
        });
        server.listen(port);
      });
      
      // close the connection
      server.close();
      socket.destroy();
      
      // listen for reconnect
      socket.on('reconnect', function() {
        assert.isTrue(reconnected);
        done();
      });
    });
    
    socket.connect(port);
  });
  
});

