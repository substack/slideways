var http = require('http');
var ecstatic = require('ecstatic')

var server = http.createServer(ecstatic(__dirname + '/static'));
server.listen(5001);
console.log('Example server listening on http://localhost:5001');
