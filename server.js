var http = require('http');
var fs = require('fs');
var url = require('url');

http.createServer(function(req, res) {
  var pathname = url.parse(req.url).pathname;
  res.end('hi');
}).listen('3376');