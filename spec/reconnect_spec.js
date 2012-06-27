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
    socket = new EverSocket({ type: 'tcp4', reconnectWait: 1 });
  });
  
  afterEach(function() {
    try { 
      socket.destroy(); 
    } catch(e) {}
    try { 
      server.close(); 
    } catch(e) {}
  });
  
  it('should connect', function(done) {
    var serverConnected = false;
    var clientConnected = false;
    server.on('connection', function() {
      serverConnected = true;
    });
    socket.on('connect', function() {
      clientConnected = true;
    })
    socket.connect(port);
    setTimeout(function() {
      assert.isTrue(serverConnected);
      assert.isTrue(clientConnected);
      done();
    }, 10);
  });
  
  it('should reconnect', function(done) {
    var reconnected = false;
    
    server.once('connection', function() {
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
      socket.reset();
      
      // listen for reconnect
      socket.once('reconnect', function() {
        setTimeout(function() {
          assert.isTrue(reconnected);
          done();
        }, 100);
      });
    });
    
    socket.connect(port);
  });
  
  it('should not reconnect after destroy', function(done) {
    var reconnected = false;
    
    server.once('connection', function() {
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
    });
    
    socket.connect(port);
    setTimeout(function() {
      assert.isFalse(reconnected);
      done();
    }, 100);
  });
  
});

