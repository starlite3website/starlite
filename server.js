const http = require('http');
const fs = require('fs');
const url = require('url');
const KVdb = require('kvdb.io');
const WebSocket = require('ws');
const schedule = require('node-schedule');
const db = KVdb.bucket('HdJi23Vpua43AxiyUFnJej', '12481485');

schedule.scheduleJob('0 0 * * *', () => {
  sessionTokens = [1];
  console.log('DATA RESET');
})

var sockets = [];
var sessionTokens = [1];
var pvpRooms = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var message = {};
var status = {};

const server = http.createServer(function(req, res) {
  var pathname = url.parse(req.url).pathname;
  if (pathname == '/') {
    pathname = '/index.html';
  } else {
    if (!pathname.includes('.')) {
      pathname += '.html';
    }
  }
  fs.readFile('starlite/'+pathname.substr(1), function(err, data) {
    if (err) {
      var data = fs.readFileSync('starlite/404.html');
      res.writeHead(404, { 'Content-Type': 'text/html' });
      console.log('FAIL'+pathname);
      res.write(data);
      res.end();
      return;
    }
    if (pathname.includes('.html')) res.writeHead(200, { 'Content-Type': 'text/html' });
    if (pathname.includes('.png')) res.writeHead(200, { 'Content-Type': 'image/png' });
    if (pathname.includes('.css')) res.writeHead(200, { 'Content-Type': 'text/css' });
    res.write(data);
    res.end();
  });
});
server.listen(process.env.PORT);

const wss = new WebSocket.Server({
  server: server,
  path: '/server',
});

wss.on('connection', function(socket) {
  sockets.push(socket);
  socket.interval = setInterval(function() {
    socket.ping(function() {});
  }, 10000);
  socket.on('message', async function(msg) {
    if (socket.username == undefined) {
      socket.username = JSON.parse(msg).username;
    }
    var data = JSON.parse(msg);
    if (data.operation === 'database') {
      if (!sessionTokens.includes(parseFloat(data.token)) && data.task != 'auth' && data.task != 'new')  {
        console.log('REJECT');
        return;
      }
      if (data.task == 'list') {
        var values = [];
        db.list({prefix: ''}).then((value) => {
          values = value;
          console.log(values);
          var l = 0, a = [];
          while (l<values.length) {
            db.get(values[l]).then((value) => {
              a.push(JSON.parse(value)[data.item]);
              if (a.length == values.length) {
                console.log(a);
                socket.send(JSON.stringify({
                  type: 'list-return',
                  data: a,
                }))
              }
            });
            l++;
          }
        });
      }
      if (data.task == 'new') {
        db.set(data.username, JSON.stringify({
          password: data.password,
          messages: '[]',
          playerdata: '{}',
          preferences: '{}',
          servers: '[]',
          fame: '0',
        })).then(() => {
          console.log('NEW: '+data.username);
          socket.send(JSON.stringify({
            success: true,
          }))
        });
      }
      if (data.task == 'get') {
        db.get(data.username).then((value) => {
          console.log('GET: '+data.username);
          socket.send(JSON.stringify({
            type: 'get-return',
            data:[JSON.parse(value)],
          }));
        })
      }
      if (data.task == 'auth') {
        db.get(data.username).then((value) => {
          if (value == undefined) {
            console.log('CREATE: '+data.username);
            var token = Math.random();
            sessionTokens.push(token);
            socket.send(JSON.stringify({
              authencated: false,
              isAccount: false,
              token: token,
            }));
            return;
          }
          value = JSON.parse(value);
          if (value.password == data.password) {
            var token = Math.random();
            sessionTokens.push(token);
            console.log('NEW SESSION: '+data.username);
            socket.send(JSON.stringify({
              authencated: true,
              token: token,
            }));
          } else {
            socket.send(JSON.stringify({
              authencated: false,
              isAccount: true,
            }));
          }
        });
      }
      if (data.task == 'update') {
        db.get(data.username).then((value) => {
          value = JSON.parse(value);
          value[data.key] = data.value;
          db.set(data.username, JSON.stringify({
            password: value.password,
            messages: value.messages,
            playerdata: value.playerdata,
            preferences: value.preferences,
            fame: value.fame,
          }));
          console.log('UPDATE: '+data.username);
          socket.send(JSON.stringify({
            success: true,
          }));
        });
      }
    } else if (data.operation === 'multiplayer') {
      if (socket.room === undefined) {
        if (JSON.parse(msg).mode == 'pvp') {
          var l = 0, ip;
          while (l < pvpRooms.length) {
            if (pvpRooms[l] < 3) {
              if (pvpRooms[l] != 0 && JSON.parse(msg).type == 'host') {
              } else {
                if (pvpRooms[l] == 0 && JSON.parse(msg).type == 'joiner') {
                } else {
                  ip = 'pvp' + l;
                  pvpRooms[l] += 1;
                  if (pvpRooms[l] == 2) {
                    sockets.forEach(function(s) {
                      if (s.room === 'pvp' + l) {
                        socket.send('{"event":"start"}');
                      }
                    })
                  }
                  socket.pvpRoom = l;
                  socket.room = 'pvp' + l;
                  l = pvpRooms.length;
                }
              }
            }
            l++;
          }
          if (socket.pvpRoom == undefined) {
            socket.close();
            sockets = sockets.filter(s => s !== socket);
            return;
          }
        } else {
          if (JSON.parse(msg).type == 'host') {
            sockets.forEach(function(s) {
              if (s.type == 'host' && s.room == JSON.parse(msg).room) {
                socket.close();
                sockets = sockets.filter(s => s !== socket);
              }
            });
          }
          socket.room = JSON.parse(msg).room;
          socket.type = JSON.parse(msg).type;
        }
      } else {
        sockets.forEach(function(s) {
          if (s.room === socket.room && s !== socket) {
            s.send(msg);
          }
        });
      }
    } else if (data.operation == 'status') {
      if (!sessionTokens.includes(data.token)) return;
      if (data.task == 'get') {
        socket.send(JSON.stringify({
          status: status[data.username],
          message: message[data.username]
        }));
      }
      if (data.task == 'set') {
        status[data.username] = data.status;
        message[data.username] = data.message;
      }
    } else if (data.operation == 'chat') {
      sockets.forEach(function(s) {
        if (s != socket) {
          s.send(JSON.stringify({
            type: 'chat',
            message: data.message,
          }))
        }
      })
    }
  });
  socket.on('close', function() {
    sockets.forEach(function(s) {
      if (s !== socket) {
        s.send(JSON.stringify({
          event: 'disconnect',
          username: socket.username,
        }));
      }
      if (s === socket) {
        clearInterval(socket.interval)
      }
    });
    if (socket.pvpRoom != undefined) {
      pvpRooms[socket.pvpRoom] -= 1;
    }
    sockets = sockets.filter(s => s !== socket);
  });
});
