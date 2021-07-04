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
var servers = {};

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
              ip = 'pvp' + l;
              pvpRooms[l] += 1;
              socket.pvpRoom = l;
              socket.room = 'pvp' + l;
              l = pvpRooms.length;
              if (pvpRooms[l] == 1) {
                servers[ip] = new Host();
                servers[ip].control(ip);
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
          
          if (servers[JSON.parse(msg).room] == undefined) {
            servers[JSON.parse(msg).room] = new Host();
            servers[JSON.parse(msg).room].control(JSON.parse(msg).room);
          }
          servers[JSON.parse(msg).room].sockets.push(socket);
          socket.room = JSON.parse(msg).room;
        }
      } else {
        if (JSON.parse(msg).event == 'joinerupdate') {
          servers[socket.room].joinerupdate(JSON.parse(msg).data);
        }
        if (JSON.parse(msg).event == 'joinerjoin') {
          servers[socket.room].joinerjoin(JSON.parse(msg).data);
        }
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
    this.channelname = channelname;
    this.s = [];
    this.b = [];
    this.pt = [];
    this.sockets = [];
    setInterval(function(host) {
      // add level multiplayer code here
      host.send();
    }, 15, this);
    setInterval(function(host) {
      var l = 0;
      while (l<host.s.length) {
        this.s.update();
        l++;
      }
    }, 30, this);
  }
  joinerupdate(data) {
    var tank = data;
    var l = 0;
    while (l < this.pt.length) {
      if (!this.pt[l].ded) {
        if (this.pt[l].username == tank.username) {
          //if (this.checker(this.pt[l].x + tank.x, this.pt[l].y)) { // require checker
            this.pt[l].x += tank.x;
          //}
          //if (checker(pt[l].x, pt[l].y + tank.y)) {
            this.pt[l].y += tank.y;
          //}
          if (tank.shielded) {
            this.pt[l].shields = 5;
            setTimeout(function (l) {
              this.pt[l].shields = 0;
            }, 10000, l);
          }
          this.pt[l].base = tank.base;
          this.pt[l].rotation = tank.rotation;
          this.pt[l].leftright = tank.leftright;
          this.pt[l].invis = tank.invis,
          this.pt[l].canChangeInvisStatus = tank.canChangeInvisStatus;
          this.pt[l].canInvis = tank.canInvis;
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
            this.pt[l].health = .75 * this.pt[l].maxHealth;
          }
          if (tank.fire) {
            this.pt[l].pushback = -3;
            if (tank.rotation > 180 && tank.rotation < 270) {
              this.s.push(new Shot(this.pt[l].x + 20, this.pt[l].y + 20, this.s.length - 1, -tank.yd, tank.xd));
            } else if (tank.rotation > 270) {
              this.s.push(new Shot(this.pt[l].x + 20, this.pt[l].y + 20, this.s.length - 1, tank.yd, -tank.xd));
            } else {
              this.s.push(new Shot(this.pt[l].x + 20, this.pt[l].y + 20, this.s.length - 1, tank.xd, tank.yd));
            }
          }
        }
      }
      l++;
    }
  }
  joinerjoin(data) { //done
    // registers a new tank to the server
    // pt = playertanks, teamData = team core hp and team playertanks
    var tank = data;
    tank.x = 0;
    tank.y = 0;
    this.pt.push(tank);
  }
  disconnect(username) { // done?
    var l = 0;
    while (l < this.pt.length) {
      if (this.pt[l].username == username) {
        this.pt.splice(l, 1);
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
        tanks: this.pt,
        blocks: this.blockData,
        scaffolding: this.scaffolding,
        bullets: this.s,
      }));
      l++
    }
  }
}
function Block(health, x, y, isInvincible, isExplosive, isScaffolding, host) {
  this.host = host;
  this.blockId = b.length - 1;
  this.x = x;
  this.y = y;
  this.isScaffolding = isScaffolding;
  this.wall = function (x, y) {
    if (this.health == undefined) {
      this.health = Infinity; this.type = 'wall';
    }
  }
  this.strong = function (x, y) {
    if (this.health == undefined) {
      this.health = 80;
      this.type = 'strong';
    }
  }
  this.weak = function (x, y) {
    if (this.health == undefined) {
      this.health = 40;
      this.type = 'weak';
    }
  }
  /*i.push(window.setInterval(function () {
    var l = 0;
    while (l < b.length) {
      if (ai_check(b[l].x * 50, b[l].y * 50, true)) {
        draw.fillStyle = "#FF0000";
        draw.fillRect(b[l].x * 50, b[l].y * 50, 50, 50);
        b[l].health -= 10;
        if (b[l].health <= 0) {
          if (Game.level == 'multiplayer') {
            let isScaffolding = false;
            var t = 0;
            while (t < b.length) {
              var q = 0;
              while (q < user.tank.scaffolding.length) {
                if (b[t].x == user.tank.scaffolding[q].x) {
                  if (b[l].y == user.tank.scaffolding[q].y) {
                    isScaffolding = true;
                  }
                }
                q++;
              }
              t++;
            }
            if (!isScaffolding) {
              var strand = user.host.blockData[b[l].y + 10].split('');
              strand[b[l].x + 10] = ' ';
              user.host.blockData[b[l].y + 10] = strand.join('');
            } else {
              var q = 0;
              while (q < user.tank.scaffolding.length) {
                if (b[l].y == user.tank.scaffolding[q].y) {
                  if (b[l].x == user.tank.scaffolding[q].x) {
                    user.tank.scaffolding.splice(q, 1);
                  }
                }
                q++;
              }
            }
          }
          var q = 0;
          while (q < this.host.scaffolding.length) {
            if (this.host.b[l].y == this.host.scaffolding[q].y) {
              if (this.host.b[l].x == this.host.scaffolding[q].x) {
                this.host.scaffolding.splice(q, 1);
              }
            }
            q++;
          }
          this.block_support();
        }
      }
      l++;
    }
  }, 50));*/
  this.block_support = function() {
    this.x = -1000;
    this.y = -1000;
  }
}
class Shot { // done
  constructor(x, y, id, xm, ym) {
    this.xm = xm;
    this.ym = ym;
    while (this.xm * this.xm + this.ym * this.ym > 1.2 || this.xm * this.xm + this.ym * this.ym < 1) {
      if (this.xm * this.xm + this.ym * this.ym > 1.1) {
        this.xm /= 1.01;
        this.ym /= 1.01;
      }
      if (this.xm * this.xm + this.ym * this.ym < 1.1) {
        this.xm *= 1.01;
        this.ym *= 1.01;
      }
    }
    this.xm = this.xm * 7;
    this.ym = this.ym * 7;
    this.y = y;
    this.x = x;
    while ((this.x < x + 35 && this.x > x - 35) && (this.y < y + 35 && this.y > y - 35)) {
      this.x = this.x + xm / 5;
      this.y = this.y + ym / 5;
    }
    this.counter = 0;
    this.id = id;
  }
  update() {
    this.x += this.xm / 2;
    this.y += this.ym / 2;
  }
}
