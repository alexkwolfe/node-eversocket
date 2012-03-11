var net = require('net'),
    events = require('events'),
    util = require('util');

var EverSocket = function(options) {
  events.EventEmitter.call(this);
  
  this._options = options || {};
  this._type = options.type || 'tcp4';
  this._idle = options.idle || 0;
  this._keepAlive = options.keepAlive;
  this._keepAliveDelay = options.keepAliveDelay;
  this._encoding = options.encoding || null;
  this._socket = options.socket || net.Socket(options);
  this._connected = this._socket.writable && this._socket.readable || false;
  
  this._retry = {
    wait: options.retryWait || 1000,
    waiting: false
  };
  
  this._setup();
};

util.inherits(EverSocket, events.EventEmitter);

EverSocket.prototype.setKeepAlive = function(keepAlive, initialDelay){
  this._socket.setKeepAlive(keepAlive, initialDelay);
  this._keepAlive = keepAlive;
  this._keepAliveDelay = initialDelay;
};

EverSocket.prototype.setIdle = function setIdle(time) {
  this._socket.setTimeout(time);
  this._idle = time;
};

EverSocket.prototype.setEncoding = function setEncoding(encoding) {
  this._socket.setEncoding(encoding);
  this._encoding = encoding;
}

EverSocket.prototype.write = function write() {
  this._socket.write.apply(this._socket, arguments);
}

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
  
  if (callback) {
    args.push(callback);
  }
  
  this._connected = true;
  this._socket.connect.apply(this._socket, args);
};

EverSocket.prototype.reconnect = function reconnect() {
  var self = this;
  
  //
  // Helper function containing the core reconnect logic
  //
  function doReconnect() {
    
    if (self._retry.waiting)
      return;
      
    //
    // Cleanup and recreate the socket associated
    // with this instance.
    //
    self._retry.waiting = true;
    self._socket.removeAllListeners();
    self._socket = net.Socket(self._options);
    
    //
    // Cleanup reconnect logic once the socket connects
    //
    self._socket.once('connect', function () {
      self.emit('reconnect');
      self._retry.waiting = false;
    });
    
    //
    // Attempt to reconnect the socket
    //
    self._setup();
    self.connect();
  }
  
  setTimeout(doReconnect, this._retry.wait);
};

EverSocket.prototype.destroy = function destroy() {
  this.removeAllListeners();

  if (this._socket) {
    try {
      this._socket.end(); // FIN
      this._socket.destroy(); // fd's
    } catch (ex) {
      // swallow
    }
  }
  
  this.emit('destroy');
};

EverSocket.prototype.end = function end() {
  var hadErr;
  this._connected = false;

  if (this_.socket) {
    try {
      this._socket.write.apply(this._socket, arguments);
    } catch (ex) {
      this.emit('error', ex);
      hadErr = true;
      return;
    }
    
    this._socket = null;
  }
  return this.emit('close', hadErr || undefined);
};

EverSocket.prototype._setup = function _setup() {
  this.setKeepAlive(this._keepAlive, this._keepAliveDelay);
  this.setIdle(this._idle);
  this.setEncoding(this._encoding);
  
  this._socket.on('connect', this._onConnect.bind(this));
  this._socket.on('data',    this._onData.bind(this));
  this._socket.on('close',   this._onClose.bind(this));
  this._socket.on('error',   this._onError.bind(this));
  this._socket.on('timeout', this._onTimeout.bind(this));
};

EverSocket.prototype._onConnect = function _onConnect() {
  this.emit('connect');
};

EverSocket.prototype._onData = function _onData(data) {
  this.emit('data', data)
};

EverSocket.prototype._onClose = function _onClose(hadError) {
  if (hadError) {
    this.emit('close', hadError, arguments[1]);
  } else {
    this.emit('close');
  }
  
  this._connected = false;
  this.reconnect();
};

EverSocket.prototype._onError = function _onError(error) {
  this._connected = false;
  this.reconnect();
};

EverSocket.prototype._onTimeout = function _onTimeout() {
  this.emit('timeout');
};

exports.EverSocket = EverSocket;