const http = require('http');
const fs = require('fs');
const url = require('url');

http.createServer(function(req, res) {
  var pathname = url.parse(req.url).pathname;
  if (pathname == '/') {
    pathname = '/index.html';
  } else {
    if (!pathname.includes('.')) {
      pathname += '.html';
    }
  }
  fs.readFile(pathname, function(err, data) {
    if (err) {
      res.end();
      return;
    }
    if (pathname.includes('.html')) res.writeHead(200, {'Content-Type':'text/html'});
    if (pathname.includes('.png')) res.writeHead(200, {'Content-Type':'image/png'});
    if (pathname.includes('.css')) res.writeHead(200, {'Content-Type':'text/css'});
    res.write(data);
    res.end();
  });
}).listen(1000);