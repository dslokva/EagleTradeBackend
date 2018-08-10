var express = require("express");
var ws = require('ws');
var app = express();
var async = require('async');
var sleep = require('sleep'); 
var net = require('net');

var last50spots = [];

var client = new net.Socket();

client.connect(8000, 'dxc.kfrr.kz', function() {
  console.log('Connected');
  once = true;
});

client.on('data', function(data) {
  var line = "" + data;
  
  if (last50spots.length > 300) last50spots.shift();
  var dxLine = line.trim();
  if (dxLine.startsWith("DX"))
    last50spots.push(dxLine.slice(0, -2));

  console.log(line.trim());

  if (once) {
    sleep.sleep(1);
    client.write('UN7ZAF-1\n');
    once = false;
  }
	//client.destroy(); // kill client after server's response
});

client.on('close', function() {
	console.log('Connection closed');
});


app.get('/ws', function(req, res) {
    res.send('hello');
});

var WebSocketServer = require('ws').Server,
wss = new WebSocketServer({port: 40510})

wss.on('connection', function (ws) {
  ws.on("error", function(ws) {
      console.log('Clients count: '+wss.clients.size);
  });
  
  ws.on('message', function (message) {
    clientMessage = JSON.parse(message);
    console.log('received: %s', JSON.stringify(clientMessage));

    if (clientMessage.request === 'getLast50Spots') {  
      //console.log(last50spots);
      
      let fullData = JSON.parse('{"last_50_spots":[]}');
      let calls = [];

      calls.push(function(callback) {
        let count = 0;
            last50spots.forEach(function(value) {
              console.log(value);
              var rePattern = new RegExp(/DX de ([A-Z0-9\/\-]+):\s+(\d+.\d+)\s+([A-Z0-9\/\-]+)\s+(.*)?(\d{4}Z)/);
              var arrMatches = value.match(rePattern);
              // console.log(arrMatches);
              let spot = JSON.parse('{"spot": {"de": "'+arrMatches[1]+'", "freq": "'+arrMatches[2]+'", "dx": "'+arrMatches[3]+'", "comment": "'+arrMatches[4]+'", "time": "'+arrMatches[5]+'"}}');
              fullData.last_50_spots.push(spot);
              count++; 
              if (count > 49) return;
            });

          callback();
        }
      );

      async.parallel(calls, function() {
        ws.send(JSON.stringify(fullData));
        //console.log(fullData);
      });
    }
    
  setInterval(
    () => {
      var options = {
        year: 'numeric', month: 'long', day: 'numeric',
        weekday: 'long',
        timezone: 'UTC',
        hour: 'numeric', minute: 'numeric', second: 'numeric'
      };
      
      let date = new Date();
      let dateStr = date.toLocaleString('en-US', options);

      wss.clients.forEach(function each(client) {
        if (client !== ws && client.readyState === ws.OPEN) {
          var tickObj = {} 
          var tick = { dateStr };
          tickObj.tick = tick;
          client.send(JSON.stringify(tickObj));
        }
      });
    },
    10000
  );
  });
});

app.listen(3000, function(){
    console.log("Server started at port 3000");
});