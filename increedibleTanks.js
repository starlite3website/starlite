var interval, user, listener, interval2, b = [], s = [], Game = new Game();

function Shot(x, y, r, t, l, u, id) {
  this.x = x;
  this.y = y;
  this.r = r;
  this.t = t;
  this.l = l;
  this.u = u;
  this.id = id;
  this.inactive = false;
  this.control = function() {
    intervalShot(this.x, this.y);
  }

}
function intervalShot(x, y) {
  window.setInterval(drawShot(x, y), 50);
}
function drawShot(x, y) {
  draw.fillRect(x,y,50,50)
}
function Tank() {
  this.r = 0;
  this.x = 50;
  this.y = 50;
  this.mode = 0;
  this.color = "#00ff00";
  this.draw = function() {
    draw.fillStyle = this.color;
    draw.fillRect(this.x, this.y, 40, 40);
    draw.fillStyle = "#A9A9A9";
    draw.fillRect(this.x + 30, this.y, 10, 40);
    draw.fillRect(this.x, this.y, 10, 40);
    draw.fillStyle = this.color;
    draw.fillRect(this.x + 15, this.y + 25, 10, 20);
    draw.strokeRect(this.x + 15, this.y + 25, 10, 20);
    draw.beginPath();
    draw.arc(this.x + 20, this.y + 20, 12, 0, 2 * Math.PI);
    draw.stroke();
    draw.arc(this.x + 20, this.y + 20, 12, 0, 2 * Math.PI);
    draw.fill();

  }
  this.control = function() {
    this.draw();
    $('#canvas').focus();
    $('#canvas').bind('keydown', function(event) {
      jquery_tank_support(event);
    });
  }
  this.checker = function(n, isX) {
    var x1, x2, y1, y2;
    x1 = this.x + n;
    x2 = this.x + 40 + n;
    y1 = this.y + n;
    y2 = this.y + 40 + n;
    for (var r = 0; r < Game.blockId; r++) {
      if (isX) {
        bx = b[r].x * 50;
        if ((bx < x1 && bx + 50 > x1) || (bx < x2 && bx + 50 > x2)) {
          return false;
        } else {
          return true;
        }
      } else {
        by = b[r].y * 50;
        if ((by < y1 && by + 50 > y1) || (by < y2 && by + 50 > y2)) {
          return false;
        } else {
          return true;
        }
      }
    }
  }
  this.move = function(e) {
    if (e.keyCode == 38) {
      if (this.checker(-5, false)) {
        this.y -= 5;
      }
      e.preventDefault();
    } else if (e.keyCode == 40) {
      if (this.checker(5, false)) {
        this.y += 5;
      }
      e.preventDefault();
    } else if (e.keyCode == 37) {
      if (this.mode == 1) {
        this.r += 2;
        draw.rotate(this.r * Math.Pi / 180);
      } else {
        if (this.checker(-5, true)) {
          this.x -= 5;
        }

      }
    } else if (e.keyCode == 39) {
      if (this.mode == 1) {

      } else {
        if (this.checker(5, true)) {
          this.x += 5;
        }
      }
    } else if (e.keyCode == 32) {
      e.preventDefault();
      this.fire();
    }
    level(1, "n");
    this.draw();
  }
  this.fire = function() {
    Game.shotId = Game.shotId + 1;
    s[Game.shotId] = new Shot(this.x, this.y, this.r, 1, 1, 1, 'Increedible');
  s[Game.shotId].control();
  }
} // Tank Object
function Game() {
  this.shotId = 0;
  this.blockId = 0;
  this.redraw = function() {
    for (var r = 1; r == this.shotId; r++) {
      s[r].redraw();
    }
  }
}

function jquery_tank_support(e) {
  user.tank.move(e);
}

function Block(health, x, y, isInvincible, isExplosive) {
  if (!isInvincible) {
    this.health = health;
  } else {
    this.health = Infinity;
  }
  if (isExplosive) {
    this.e = true;
  } else {
    this.e = false;
  }
  this.x = x;
  this.y = y;
  this.damage = function() {
    for (var r = 0; r == 5; r++) {

    }
  }
} // All Blocks

var alertConsole = document.getElementById("alertConsole"); // console for game
var chat = document.getElementById("chat");
var messages = document.getElementById("messages");
var message = document.getElementById("message");
var playText = document.getElementById("playText");
var canvas = document.getElementById("canvas"); // getting the canvas element
var consoleText = document.getElementById("consoleText"); // text control for console
var chatSubmit = document.getElementById("chat_submit");
var draw = canvas.getContext("2d"); // getting the canvas to be able to draw

function startScreen() {
  chat_setup();

  a("Loading Game...", "black");
  draw.fillStyle = "#DCDCDC";
  draw.fillStyle = "#000000";
  draw.font = "20px Courier";
  wall(0, 3);
  wall(0, 4);
  wall(0, 5);
  wall(0, 6);
  strong(1, 6);
  weak(1, 4);
  wall(2, 4);
  strong(2, 5);
  strong(2, 3);
  draw.fillStyle = "#556B2F";
  draw.fillRect(0, 0, 500, 150);
  draw.fillRect(0, 350, 500, 150);
  draw.fillStyle = "#ffffff";
  draw.font = "50px Courier";
  draw.fillText("Increedible", 100, 60);
  draw.fillText("Tanks", 175, 120);
  canvas.addEventListener("click", loading, false);
} // startScreen

function alert_startup() {
  alertConsole.style.visibility = "hidden";
} // alert Setup

function a(m, c) {
  alertConsole.classList.add("console");
  alertConsole.style.backgroundColor = c;
  alertConsole.style.border = "1px solid black";
  consoleText.innerHTML = m;
  alertConsole.style.visibility = "visible";
  interval = window.setInterval(alert_end, 8000);
} // alert control

function alert_end() {
  window.clearInterval(interval);
  alertConsole.classList.remove("console");
  alertConsole.style.visibility = "hidden";

} // alert end

function loading() {
  if (true) {
    user = {
      username: "starlite_developer",
      tank: new Tank(),
      level: 1,
      coins: 50,
      gems: 0,
      team: "Increedible: " + "",
    }
  }
  draw.clearRect(0, 0, 500, 500);
  a("Starting Game...");
  playText.style.visibility = "hidden";
  interval2 = window.setInterval(mainMenu, 2000);
  canvas.removeEventListener("click", loading);
}

function level(num, mo, m) {

  draw.clearRect(0, 0, 500, 500);
  draw.fillStyle = "#dcdcdc";
  draw.fillRect(0, 0, 500, 500);
  user.tank.control();

  if (num == 1) {
    if (mo != "n") {
      spawn(0, 1);
    }
    weak(2, 0, m);
    weak(3, 0, m);
    strong(5, 0, m);
    // enemy(6,0, m);
    // bomb(7,0, m);
    // enemy(8,0, m);
    weak(9, 0, m);
    weak(2, 1, m);
    weak(3, 1, m);
    strong(6, 1, m);
    strong(8, 1, m);
    weak(2, 2, m);
    weak(3, 2, m);
    wall(0, 3, m);
    wall(1, 3, m);
    wall(2, 3, m);
    wall(3, 3, m);
    wall(4, 3, m);
    wall(5, 3, m);
    wall(6, 3, m);
    wall(7, 3, m);
    wall(8, 3, m);
    weak(9, 3, m);
    // chest(200,1,4, m);
    wall(3, 4, m);
    // enemy(4,4, m);
    // enemy(5,4,m);
    wall(6, 4, m);
    // chest(9,4, m);
  }
  if (n === 2) {
    // level two
  }
}

function click_support() {
  level(1, true, true);
}

function mainMenu(mode) {
  window.clearInterval(interval2);
  if (mode == undefined) {
    mode = "s";
  }
  draw.clearRect(0, 0, 500, 500);
  playText.style.visibility = "hidden";
  if (mode == "s") {
    draw.fillStyle = "#556B2F";
    draw.fillRect(50, 50, 400, 400);
    draw.fillStyle = "#ffffff";
    draw.fillRect(75, 95, 50, 50);
    draw.font = "15px Courier";
    draw.fillText(user.username, 150, 125);
    draw.fillText("Level:" + user.level, 325, 125);
    draw.fillText("Coins:" + user.coins, 75, 190);
    draw.fillText("Gems:" + user.gems, 75, 210);
    draw.fillText("Type:" + user.type, 75, 230);
    draw.fillText("Team:" + user.team, 75, 250);
    draw.fillText("Settings", 150, 270);
  } else if (mode == "b") {

  }
  canvas.addEventListener("click", click_support);
} // main Menu


function wall(x, y, m) {
  if (m) {
    Game.blockId++;
  }
  b[Game.blockId] = new Block(0, x, y, true);
  draw.strokeStyle = "#000000";
  draw.fillStyle = "#ADD8E6";
  draw.strokeRect(x * 50, y * 50, 50, 50);
  draw.fillRect(x * 50, y * 50, 50, 50);
  draw.beginPath();
  draw.moveTo(x * 50, y * 50);
  draw.lineTo(x * 50 + 10, y * 50 + 10);
  draw.lineTo(x * 50 + 40, y * 50 + 10);
  draw.lineTo(x * 50 + 50, y * 50 + 0);
  draw.stroke();
  draw.moveTo(x * 50, y * 50);
  draw.lineTo(x * 50 + 10, y * 50 + 10);
  draw.lineTo(x * 50 + 10, y * 50 + 40);
  draw.lineTo(x * 50, y * 50 + 50);
  draw.stroke();
  draw.moveTo(x * 50, y * 50 + 50);
  draw.lineTo(x * 50 + 10, y * 50 + 40);
  draw.lineTo(x * 50 + 40, y * 50 + 40);
  draw.lineTo(x * 50 + 50, y * 50 + 50);
  draw.stroke();
  draw.moveTo(x * 50 + 50, y * 50 + 50);
  draw.lineTo(x * 50 + 40, y * 50 + 40);
  draw.lineTo(x * 50 + 40, y * 50 + 10);
  draw.lineTo(x * 50 + 50, y * 50 + 0);
  draw.stroke();
} // creates a wall

function strong(x, y, m) {
  if (m) {
    Game.blockId++;
  }
  b[Game.blockId] = new Block(20, x, y, false, false);
  draw.strokeStyle = "#000000";
  draw.fillStyle = "#D3D3D3";
  draw.strokeRect(x * 50, y * 50, 50, 50);
  draw.fillRect(x * 50, y * 50, 50, 50);
  draw.beginPath();
  draw.moveTo(x * 50, y * 50);
  draw.lineTo(x * 50 + 10, y * 50 + 10);
  draw.lineTo(x * 50 + 40, y * 50 + 10);
  draw.lineTo(x * 50 + 50, y * 50 + 0);
  draw.stroke();
  draw.moveTo(x * 50, y * 50);
  draw.lineTo(x * 50 + 10, y * 50 + 10);
  draw.lineTo(x * 50 + 10, y * 50 + 40);
  draw.lineTo(x * 50, y * 50 + 50);
  draw.stroke();
  draw.moveTo(x * 50, y * 50 + 50);
  draw.lineTo(x * 50 + 10, y * 50 + 40);
  draw.lineTo(x * 50 + 40, y * 50 + 40);
  draw.lineTo(x * 50 + 50, y * 50 + 50);
  draw.stroke();
  draw.moveTo(x * 50 + 50, y * 50 + 50);
  draw.lineTo(x * 50 + 40, y * 50 + 40);
  draw.lineTo(x * 50 + 40, y * 50 + 10);
  draw.lineTo(x * 50 + 50, y * 50 + 0);
  draw.stroke();
} // creates a strong block
function spawn(x, y) {
  user.tank.x = x;
  user.tank.y = y;
  user.tank.spawn = [x, y];
}

function weak(x, y, m) {
  if (m) {
    Game.blockId++;
  }
  b[Game.blockId] = new Block(10, x, y, false, false);
  draw.strokeStyle = "#000000";
  draw.fillStyle = "#ffffff";
  draw.strokeRect(x * 50, y * 50, 50, 50);
  draw.fillRect(x * 50, y * 50, 50, 50);
  draw.beginPath();
  draw.moveTo(x * 50, y * 50);
  draw.lineTo(x * 50 + 10, y * 50 + 10);
  draw.lineTo(x * 50 + 40, y * 50 + 10);
  draw.lineTo(x * 50 + 50, y * 50 + 0);
  draw.stroke();
  draw.moveTo(x * 50, y * 50);
  draw.lineTo(x * 50 + 10, y * 50 + 10);
  draw.lineTo(x * 50 + 10, y * 50 + 40);
  draw.lineTo(x * 50, y * 50 + 50);
  draw.stroke();
  draw.moveTo(x * 50, y * 50 + 50);
  draw.lineTo(x * 50 + 10, y * 50 + 40);
  draw.lineTo(x * 50 + 40, y * 50 + 40);
  draw.lineTo(x * 50 + 50, y * 50 + 50);
  draw.stroke();
  draw.moveTo(x * 50 + 50, y * 50 + 50);
  draw.lineTo(x * 50 + 40, y * 50 + 40);
  draw.lineTo(x * 50 + 40, y * 50 + 10);
  draw.lineTo(x * 50 + 50, y * 50 + 0);
  draw.stroke();
}

function chat_setup() {
  chatSubmit.addEventListener("click", chat_submit);
}

function chat_submit() {
  if (message.value != "") {
    if (user.username != undefined) {
      var newMessage = document.createElement("SPAN");
      newMessage.innerHTML = user.username + ": " + message.value;
      messages.appendChild(newMessage);
      newMessage.classList.add("message");
      a("Message Sent", "green");
    } else {
      a("Start Game First", "red");
    }
  } else {
    a("Enter Text to Submit", "red");
  }
}
startScreen();
