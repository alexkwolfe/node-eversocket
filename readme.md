A Node.js net.Socket that automatically reconnects on close. 

## Options

Options are the same as those for the net.Socket constructor, with the exception of `reconnectWait` which specifies the number of milliseconds to wait between reconnection events. This option can also be set using the `setReconnectWait` mutator.

## Events

The regular net.Socket events are emitted. The `reconnect` event has been added to notify on reconnection events.

## Usage

```javascript
var EverSocket = require('eversocket').EverSocket;
// Create a new socket. 
// If the connection closes, wait 100ms then reconnect.
var socket = new EverSocket({ type: 'tcp4', reconnectWait: 100 });
socket.on('reconnect', function() {
  console.log('the socket reconnected following a close event');
});
socket.connect(4999);
```