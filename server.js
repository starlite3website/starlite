var express = require('express');
var app = express();

app.use(express.static(__dirname + '/starlite/'));

app.listen(process.env.PORT, function() {
  console.log("Node app is running at localhost:" + app.get('port'))
});
