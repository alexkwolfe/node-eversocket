A Node.js net.Socket that automatically reconnects on close or timeout. 

## Options

Options are the same as those for the net.Socket constructor, with a few additions:

 * `reconnectWait` &mdash; the number of milliseconds to wait between reconnection events
 * `reconnectOnTimeout` &mdash; `true` or `false`. Whether to automatically reconnect when the connection goes idle.
 * `timeout` &mdash; The idle timeout. You must provide a timeout if you want to use `reconnectOnTimeout`.
 
All of the options can also be set after socket construction using their mutator methods.

## Events

The regular net.Socket events are emitted. The `reconnect` event has been added to notify on reconnection events.

## Usage

```javascript
var EverSocket = require('eversocket').EverSocket;
var socket = new EverSocket({ 
  type: 'tcp4', 
  reconnectWait: 100,      // wait 100ms after close event before reconnecting
  timeout: 100,            // set the idle timeout to 100ms
  reconnectOnTimeout: true // reconnect if the connection is idle
});
socket.on('reconnect', function() {
  console.log('the socket reconnected following a close or timeout event');
});
socket.connect(4999);
```