const ws = new require('ws');
const wss = new ws.Server({noServer:true});
let sockets = new Set();
http.createServer((req, res) => {
  wss.handleUpgrade(req, req.socket, Buffer.alloc(0), newSocket);
});
function newSocket(ws) {
  sockets.add(ws);
  ws.onopen = function() {
    ws.send('Identification Required');
  }
}
