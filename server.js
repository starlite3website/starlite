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
  console.log(pathname);
  fs.readFile(pathname.substr(1), function(err, data) {
    if (err) {
      console.log('2:'+pathname)
      pathname = pathname.substr(1);
      pathname = pathname.replace('.html', '/index.html');
      fs.readFile(pathname, function(err, data) {
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
      if (data.task == 'admin-servers') {
        var l = 0, serversOnline = 0, serverData = [], g = Object.values(servers);
        while (l<g.length) {
          if (g[l] != undefined) {
            serversOnline++;
            var q = 0, players = [];
            while (q<g[l].sockets.length) {
              players.push(g[l].sockets[q].username);
              q++;
            }
            serverData.push({
              serversOnline: serversOnline,
              serverRoom: g[l].channelname,
              playerNum: g[l].sockets.length,
              players: players,
            });
          }
          l++;
        }
        socket.send(JSON.stringify(serverData));
      }
      if (data.task == 'admin-crash') {
        var l = 0, g = Object.values(servers);
        while (l<g.length) {
          if (g[l].channelname == data.channel) {
            var q = 0;
            while (q<servers[g[l].channelname].sockets.length) {
              servers[g[l].channelname].sockets[q].close();
              q++;
            }
            var q = 0;
            while (q<servers[g[l].channelname].i.length) {
              clearInterval(servers[g[l].channelname].i[q]);
              q++;
            }
            delete servers[g[l].channelname];
            servers[g[l].channelname] = undefined;
          }
          l++;
        }
      }
      if (data.task == 'admin-kick') {
        var l = 0, g = Object.values(servers);
        while (l<g.length) {
          var q = 0;
          while (q<g[l].sockets.length) {
            if (g[l].sockets[q].username == data.victim) {
              servers[g[l].channelname].disconnect(data.victim);
            }
            q++;
          }
          l++;
        }
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
    if (socket.room != undefined) {
      servers[socket.room].disconnect(socket.username);
    }
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
    this.scaffolding = [];
    this.sockets = [];
    this.i = [];
    this.i.push(setInterval(function(host) {
      // add level multiplayer code here
      host.send();
    }, 10, this));
    this.i.push(setInterval(function(host) {
      var l = 0;
      while (l<host.s.length) {
        host.s[l].update();
        l++;
      }
    }, 14, this));
    this.i.push(setInterval(function(host) {
      var l = 0;
      while (l < host.pt.length) {
        if (host.pt[l].ded != true) {
          if (ai_check(host.pt[l].x, host.pt[l].y, false, host)) {
            if (host.pt[l].shields > 0) {
              host.pt[l].shields -= 1;
            } else if (host.pt[l].immune) {} else {
              host.pt[l].health -= 20;
              host.pt[l].invis = false;
              host.pt[l].damagedRecent = true;
              setTimeout(function(l, host) {
                if (host.pt[l] != undefined) host.pt[l].damagedRecent = false;
              }, 10000, l, host);
              if (host.pt[l].health <= 0) {
                host.pt[l].ded = true;
                if (host.pt[l].team == 'red') {
                  host.pt[l].x = 50;
                  host.pt[l].y = -500;
                } else {
                  host.pt[l].x = -100;
                  host.pt[l].y = -500;
                }
                setTimeout(function(l, host) {
                  host.pt[l].ded = false;
                  host.pt[l].health = host.pt[l].maxHealth;
                }, 10000, l, host);
              }
            }
          }
          if (host.pt[l].pushback != 0) {
            host.pt[l].pushback += 1;
          }
        }
        l++;
      }
      var l = 0;
      while (l < host.b.length) {
        if (ai_check(host.b[l].x * 50, host.b[l].y * 50, true, host)) {
          host.b[l].health -= 10;
          if (host.b[l].health <= 0) {
            let isScaffolding = false;
            var t = 0;
            while (t < host.b.length) {
              var q = 0;
              while (q < host.scaffolding.length) {
                if (host.b[t].x == host.scaffolding[q].x) {
                  if (host.b[l].y == host.scaffolding[q].y) {
                    isScaffolding = true;
                  }
                }
                q++;
              }
              t++;
            }
            if (!isScaffolding) {
              var strand = host.blockData[host.b[l].y + 10].split('');
              strand[host.b[l].x + 10] = ' ';
              host.blockData[host.b[l].y + 10] = strand.join('');
            } else {
              var q = 0;
              while (q < host.scaffolding.length) {
                if (host.b[l].y == host.scaffolding[q].y) {
                  if (host.b[l].x == host.scaffolding[q].x) {
                    host.scaffolding.splice(q, 1);
                  }
                }
                q++;
              }
            }
            var q = 0;
            while (q < host.scaffolding.length) {
              if (host.b[l].y == host.scaffolding[q].y) {
                if (host.b[l].x == host.scaffolding[q].x) {
                  host.scaffolding.splice(q, 1);
                }
              }
              q++;
            }
            host.b[l].block_support();
          }
        }
        l++;
      }
    }, 30, this));
    levelReader([' 2    2  2  2  222B#', '   2     2  2  #####', ' 2  22  2###########', '        2#2   2   2#', '  2  2 2 #  2   2  #', '2  2 2   #11111#1 1#', '        2#11111#1 1#', '  2 2    211 11#1 1#', '2    2  2#11111#1 1#', '22222#####11111#1 1#', '#1 1#11111#####22222', '#1 1#11111#2  2    2', '#1 1#11 112    2 2  ', '#1 1#11111#2        ', '#1 1#11111#   2 2  2', '#  2   2  # 2 2  2  ', '#2   2   2#2        ', '###########2  22  2 ', '#####  2  2     2   ', '#R222  2  2  2    2 '], true, true, [-500, 500, -500, 500], this);
  }
  joinerupdate(data) {
    var tank = data;
    var l = 0;
    while (l < this.pt.length) {
      if (!this.pt[l].ded) {
        if (this.pt[l].username == tank.username) {
          if (checker(this.pt[l].x + tank.x, this.pt[l].y, this)) { // require checker
            this.pt[l].x += tank.x;
          }
          if (checker(this.pt[l].x, this.pt[l].y + tank.y, this)) {
            this.pt[l].y += tank.y;
          }
          if (tank.shielded) {
            this.pt[l].shields = 5;
            setTimeout(function (l) {
              this.pt[l].shields = 0;
            }, 10000, l);
          }
          this.pt[l].base = tank.base;
          this.pt[l].rotation = tank.rotation;
          this.pt[l].leftright = tank.leftright;
          if (!this.pt[l].damagedRecent) this.pt[l].invis = tank.invis;
          this.pt[l].canChangeInvisStatus = tank.canChangeInvisStatus;
          this.pt[l].canInvis = tank.canInvis;
          if (tank.flashbangFired) {
            var block = checker2(this.pt[l].x, this.pt[l].y, this); // require checker2
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
            this.b[block].block_support(); // require block_support may need to be Host function
          }
          if (tank.placeScaffolding) {
            if (tank.rotation >= 0 && tank.rotation < 90) {
              weak((this.pt[l].x - 50) / 50, (this.pt[l].y + 40) / 50, true, this);
              this.scaffolding.push({ x: (this.pt[l].x - 50) / 50, y: (this.pt[l].y + 40) / 50 });
            }
            if (tank.rotation >= 90 && tank.rotation < 180) {
              weak((this.pt[l].x - 50) / 50, (this.pt[l].y - 50) / 50, true, this);
              this.scaffolding.push({ x: (this.pt[l].x - 50) / 50, y: (this.pt[l].y - 50) / 50 });
            }
            if (tank.rotation >= 180 && tank.rotation < 270) {
              weak((this.pt[l].x + 40) / 50, (this.pt[l].y - 50) / 50, true, this);
              this.scaffolding.push({ x: (this.pt[l].x + 40) / 50, y: (this.pt[l].y - 50) / 50 });
            }
            if (tank.rotation >= 270 && tank.rotation < 360) {
              weak((this.pt[l].x + 40) / 50, (this.pt[l].y + 40) / 50, true, this);
              this.scaffolding.push({ x: (this.pt[l].x + 40) / 50, y: (this.pt[l].y + 40) / 50 });
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
    tank.x = -500;
    tank.y = -450;
    tank.damagedRecent = false;
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
    if (this.sockets.length == 0) {
      var l = 0;
      while (l<this.i) {
        clearInterval(this.i[l]);
        l++;
      }
      servers[this.channelname] = undefined;
      delete this;
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
  this.blockId = host.b.length - 1;
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
function ai_check(x, y, isBlock, host) {
  var t = 40;
  if (isBlock) t = 50;
  var l = 0;
  while (l < host.s.length) {
    if (host.s[l].x > x || host.s[l].x + 5 > x) {
      if (host.s[l].x < x + t || host.s[l].x + 5 < x + t) {
        if (host.s[l].y > y || host.s[l].y + 5 > y) {
          if (host.s[l].y < y + t || host.s[l].y + 5 < y + t) {
            delete host.s[l]; // remove object from javascript memory for #lesslag
            host.s.splice(l, 1); // remove extra undefined from array(leftover from *delete s[l];*)
            return true;
          }
        }
      }
    }
    if (host.s[l].x < -500 || host.s[l].x > 500 || host.s[l].y < -500 || host.s[l].y > 500) {
      delete host.s[l];
      host.s.splice(l, 1);
    }
    l++;
  }
  return false;
}
function levelReader(array, m, quad, borders, host) {
  // quad and borders dont really matter
  for (l = 0; l < array.length; l++) {
    for (q = 0; q < array[l].split("").length; q++) {
      var p = array[l].split(""); // Block key: # = invincible, 1 = weak, 2 = strong, @ = player, A = ai
      if (p[q] == "#") {
        if (quad) {
          host.blockData[l] += '#';
          wall(q - 10, l - 10, m, host);
        } else {
          wall(q, l, m, host);
        }
      } else if (p[q] == "1") {
        if (quad) {
          host.blockData[l] += '1';
          weak(q - 10, l - 10, m, host);
        } else {
          weak(q, l, m, host);
        }
      } else if (p[q] == "2") {
        if (quad) {
          host.blockData[l] += '2';
          strong(q - 10, l - 10, m, host);
        } else {
          strong(q, l, m, host);
        }
      } else if (p[q] == "A") {
        if (quad) {
          //createAi((q - 10) * 50, (l - 10) * 50, m, 3, 3);
        } else {
          //createAi(q * 50, l * 50, m, 3, 3);
        }
      } else {
        host.blockData[l] += ' ';
      }
    }
  }
}
function weak(x, y, m, host) {
  if (m) {
    var block = new Block(10, x, y, false, false, false, host);
    block.weak();
    host.b.push(block);
  }
  // check if block hit maybe? this loops
}
function strong(x, y, m, host) {
  if (m) {
    var block = new Block(20, x, y, false, false, false, host);
    block.strong();
    host.b.push(block);
  }
  // loops
}
function wall(x, y, m, host) {
  if (m) {
    var block = new Block(0, x, y, true, false, false, host);
    block.wall();
    host.b.push(block);
  }
}
function checker(x, y, host) {
  if (x < -500|| y < -500 || x + 40 > 500 || y + 40 > 500) {
    return false;
  }
  // if touching walls then return "i cant move"
  var l = 0;
  while (l < host.b.length) {
    if ((x + 40 > host.b[l].x * 50 && x + 40 < host.b[l].x * 50 + 50) || (x > host.b[l].x * 50 && x < host.b[l].x * 50 + 50)) {
      if ((y > host.b[l].y * 50 && y < host.b[l].y * 50 + 50) || (y + 40 > host.b[l].y * 50 && y + 40 < host.b[l].y * 50 + 50)) {
        return false;
      }
    }
    l++;
  }
  return true;
}
function checker2(x, y, host) {
  var l = 0;
  while (l < host.b.length) {
    if ((x + 40 > host.b[l].x * 50 && x + 40 < host.b[l].x * 50 + 50) || (x > host.b[l].x * 50 && x < host.b[l].x * 50 + 50)) {
      if ((y > host.b[l].y * 50 && y < host.b[l].y * 50 + 50) || (y + 40 > host.b[l].y * 50 && y + 40 < host.b[l].y * 50 + 50)) {
        return l;
      }
    }
    l++;
  }
}
