var net = require('net'),
    util = require('util');

var EverSocket = function(options) {
  if (!(this instanceof EverSocket))
    return new EverSocket(options);
  
  net.Socket.call(this, options);
  
  this.setTimeout(options.timeout || 0);
  
  this._retry = {
    onTimeout: options.reconnectOnTimeout || false,
    wait: options.reconnectWait || 1000,
    waiting: false
  };
  
  this._setup();
};

util.inherits(EverSocket, net.Socket);

EverSocket.prototype.setReconnectWait = function reconnectWait(ms) {
  this._retry.wait = ms;
};

EverSocket.prototype.setReconnectOnTimeout = function reconnectOnTimeout(reconnect) {
  this._retry.onTimeout = reconnect;
  this._setupTimeoutListener();
};

EverSocket.prototype.destroy = function destroy() {
  if (this._timeoutListener) {
    this.removeListener('timeout', this._timeoutListener);  
    this._timeoutListener = null;
  }
  if (this._closeListener) {
    this.removeListener('close', this._closeListener);  
    this._closeListener = null;
  }
  this.constructor.super_.prototype.destroy();
};

EverSocket.prototype.reset = function reset() {
  this.constructor.super_.prototype.destroy.call(this);
};

EverSocket.prototype.reconnect = function reconnect() {
  var self = this;
  
  // if (this.writable && this.readable)
  //   return; // already connected
  
  // Reconnection helper
  function doReconnect() {
    
    // Bail if we're already reconnecting
    if (self._retry.waiting)
      return;

    // Set flag to indicate reconnecting
    self._retry.waiting = true;
    
    // Remove reconnecting flag after connect
    self.once('connect', function () {
      self.emit('reconnect');
      self._retry.waiting = false;
    });
    
    // Attempt to reconnect
    self._setup();
    self.connect();
  }
  
  setTimeout(doReconnect, this._retry.wait);
};

EverSocket.prototype.connect = function connect(/*port, host, callback*/) {
  var args = Array.prototype.slice.call(arguments),
      self = this,
      callback,
      host,
      port;

  args.forEach(function handle(arg) {
    var type = typeof arg;
    switch (type) {
      case 'number':
        port = arg;
        break;
      case 'string':
        host = arg;
        break;
      case 'function':
        callback = arg;
        break;
      default:
        self.emit('error', new Error('bad argument to connect'));
        break;
    }
  });

  host = host || '127.0.0.1';
  this.port = port || this.port;
  this.host = host || this.host;
  args = this.port ? [this.port, this.host] : [this.host];
  
  this.constructor.super_.prototype.connect.apply(this, args);
};

EverSocket.prototype._setup = function _setup() {
  var self = this;
  if (!this._closeListener) {
    this._closeListener = function() {
      self.reconnect();
    };
    this.on('close', this._closeListener);
  }
  this._setupTimeoutListener();
};

EverSocket.prototype._setupTimeoutListener = function _setupTimeoutListener() {
  var self = this;
  if (this._retry.onTimeout && !this._timeoutListener) {
    this._timeoutListener = function() {
      self.reset();
      self.reconnect();
    };
    this.on('timeout', this._timeoutListener);
  } else if (!this._retry.onTimeout && this._timeoutListener) {
    this.removeListener('timeout', this._timeoutListener);
    this._timeoutListener = null;
  }
};

exports.EverSocket = EverSocket;