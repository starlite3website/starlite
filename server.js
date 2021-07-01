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
  if (pathname == '/server.js') {
    var data = fs.readFileSync('404.html');
    res.writeHead(404, { 'Content-Type': 'text/html' });
    console.log('FAIL'+pathname);
    res.write(data);
    res.end();
    return;
  }
  fs.readFile(pathname.substr(1), function(err, data) {
    if (err) {
      var data = fs.readFileSync('404.html');
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
        }));
        console.log('NEW: '+data.username);
        socket.send(JSON.stringify({
          success: true,
        }));
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
      if (!sessionTokens.includes(parseFloat(data.token))) return;
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
class Host {
  control(channelname) {
    this.blockData = ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''];
    user.host.channelname = channelname;
    this.socket = new WebSocket('wss://'+window.location.hostname+'/server');
    this.socket.onopen = function () {
      user.host.socket.send(JSON.stringify({
        operation: 'multiplayer',
        room: user.host.channelname,
        username: user.username,
        type: 'host',
        mode: channelname,
      }));
    }
    this.socket.onmessage = function (data) {
      data = JSON.parse(data.data);
      if (data.event == 'joinerjoin') {
        user.host.joinerjoin(data.data);
      } else if (data.event == 'disconnect') {
        user.host.disconnect(data.username);
      } else {
        user.host.joinerupdate(data.data);
      }
    }
    teamData.red = { players: [] };
    teamData.blue = { players: [] };
    if (Math.round(Math.random() * 2)) {
      teamData.red.players.push(user.username);
      user.tank.team = 'red';
    } else {
      teamData.blue.players.push(user.username);
      user.tank.team = 'blue';
    }
    Game.level = 'multiplayer';
    window.setInterval(user.host.send, 30);
    level('multiplayer', null, true);
  }
  joinerupdate(data) {
    var tank = data;
    var l = 0;
    while (l < pt.length) {
      if (!pt[l].ded) {
        if (pt[l].username == tank.username) {
          if (checker(pt[l].x + tank.x, pt[l].y)) {
            pt[l].x += tank.x;
          }
          if (checker(pt[l].x, pt[l].y + tank.y)) {
            pt[l].y += tank.y;
          }
          if (tank.shielded) {
            pt[l].shields = 5;
            setTimeout(function (l) {
              pt[l].shields = 0;
            }, 10000, l);
          }
          pt[l].base = tank.base;
          pt[l].rotation = tank.rotation;
          pt[l].leftright = tank.leftright;
          pt[l].invis = tank.invis,
          pt[l].canChangeInvisStatus = tank.canChangeInvisStatus;
          pt[l].canInvis = tank.canInvis;
          if (tank.flashbangFired) {
            var block = checker2(this.pt[l].x, this.pt[l].y); // require checker2
            let isScaffolding = false;
            var q = 0;
            while (q < this.scaffolding.length) {
              if (this.b[block].x == this.scaffolding[q].x) {
                if (this.b[block].y == this.scaffolding[q].y) {
                  isScaffolding = true;
                }
              }
              q++;
            }
            if (!isScaffolding) {
              var strand = this.blockData[this.b[block].y + 10].split('');
              strand[this.b[block].x + 10] = ' ';
              this.blockData[this.b[block].y + 10] = strand.join('');
            } else {
              var q = 0;
              while (q < this.scaffolding.length) {
                if (this.b[block].y == this.scaffolding[q].y) {
                  if (this.b[block].x == this.scaffolding[q].x) {
                    this.scaffolding.splice(q, 1);
                  }
                }
                q++;
              }
            }
            block_support(block); // require block_support may need to be Host function
          }
          if (tank.placeScaffolding) {
            if (tank.rotation >= 0 && tank.rotation < 90) {
              weak((this.pt[l].x - 50) / 50, (pt[l].y + 40) / 50, true);
              this.scaffolding.push({ x: (pt[l].x - 50) / 50, y: (pt[l].y + 40) / 50 });
            }
            if (tank.rotation >= 90 && tank.rotation < 180) {
              weak((pt[l].x - 50) / 50, (pt[l].y - 50) / 50, true);
              user.tank.scaffolding.push({ x: (pt[l].x - 50) / 50, y: (pt[l].y - 50) / 50 });
            }
            if (tank.rotation >= 180 && tank.rotation < 270) {
              weak((pt[l].x + 40) / 50, (pt[l].y - 50) / 50, true);
              user.tank.scaffolding.push({ x: (pt[l].x + 40) / 50, y: (pt[l].y - 50) / 50 });
            }
            if (tank.rotation >= 270 && tank.rotation < 360) {
              weak((this.pt[l].x + 40) / 50, (pt[l].y + 40) / 50, true);
              this.scaffolding.push({ x: (pt[l].x + 40) / 50, y: (pt[l].y + 40) / 50 });
            }
          }
          if (tank.usingToolkit) {
            pt[l].health = .75 * pt[l].maxHealth;
          }
          if (tank.fire) {
            pt[l].pushback = -3;
            if (tank.rotation > 180 && tank.rotation < 270) {
              this.s.push(new Shot(pt[l].x + 20, pt[l].y + 20, s.length - 1, -tank.yd, tank.xd));
            } else if (tank.rotation > 270) {
              this.s.push(new Shot(pt[l].x + 20, pt[l].y + 20, s.length - 1, tank.yd, -tank.xd));
            } else {
              this.s.push(new Shot(pt[l].x + 20, pt[l].y + 20, s.length - 1, tank.xd, tank.yd));
            }
          }
        }
      }
      l++;
    }
  }
  joinerjoin(data) {
    // registers a new tank to the server
    // pt = playertanks, teamData = team core hp and team playertanks
    var tank = data;
    pt.push(tank);
  }
  disconnect(username) { // done?
    var l = 0;
    while (l < pt.length) {
      if (pt[l].username == username) {
        pt.splice(l, 1);
      }
      l++;
    }
    var l = 0;
    while (l < this.sockets.length) {
      if (this.sockets[l].username == username) {
        this.sockets.splice(l, 1);
      }
      l++;
    }
  }
  send() { //done
    var l = 0;
    while (l<this.sockets.length) {
      this.sockets[l].send(JSON.stringify({
        operation: 'multiplayer',
        event: 'hostupdate',
        tanks: pt,
        blocks: this.blockData,
        scaffolding: this.scaffolding,
        bullets: s,
      }));
      l++
    }
  }
}
