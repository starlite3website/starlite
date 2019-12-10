const webSocket = new require('ws');
webSocket.onmessage = function() {
  webSocket.send('Connection Opened')
}
