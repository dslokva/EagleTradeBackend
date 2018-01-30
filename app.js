var express = require("express")
var ws = require('ws')
var WEX = require('node-wex')
var app = express()
var async = require('async');
var wexPublic = new WEX();

var wexCoinTickers = ["ltc_usd","btc_usd","zec_usd","bch_usd","dsh_usd", "eth_usd"];
var bitfinexCoinTickers = ["ltcusd","btcusd","zecusd","bchusd","dshusd", "ethusd"];


app.get('/ws', function(req, res) {
    res.send('hello');
});

var WebSocketServer = require('ws').Server,
wss = new WebSocketServer({port: 40510})

wss.on('connection', function (ws) {
  ws.on("error", function(ws) {
      console.log('Clients count: '+wss.clients.size)
  });
  
  ws.on('message', function (message) {
    clientMessage = JSON.parse(message)
    console.log('received: %s', JSON.stringify(clientMessage))

    if (clientMessage.request === 'getPublicCoinsData') {  
      let fullData = JSON.parse('{"public_coin_data":{ "wex_public": [], "bitfinex_public": [] }}');
      let calls = [];

      for (let coinTicker of wexCoinTickers) {
        calls.push(
          function(callback) {
            wexPublic.ticker(coinTicker, function(err, data) {
              let middleData = JSON.parse(JSON.stringify(data));
              if (coinTicker == "btc_usd") coinTicker = "Bitcoin";
              if (coinTicker == "ltc_usd") coinTicker = "Litecoin";
              if (coinTicker == "zec_usd") coinTicker = "ZCash";
              if (coinTicker == "bch_usd") coinTicker = "Bitcoin cash";
              if (coinTicker == "dsh_usd") coinTicker = "Dash coin";
              if (coinTicker == "eth_usd") coinTicker = "Etherium";

              middleData.coin_pair = coinTicker;
              fullData.public_coin_data['wex_public'].push(JSON.stringify(middleData));
              callback();
            });
          }
        );
      }

      async.parallel(calls, function() {
        ws.send(JSON.stringify(fullData));
        console.log(fullData);
      });
    }
    
  // setInterval(
  //   () => {
  //     var options = {
  //       year: 'numeric', month: 'long', day: 'numeric',
  //       weekday: 'long',
  //       timezone: 'UTC',
  //       hour: 'numeric', minute: 'numeric', second: 'numeric'
  //     };
      
  //     let date = new Date();
  //     let dateStr = date.toLocaleString('en-US', options);

  //     wss.clients.forEach(function each(client) {
  //       if (client !== ws && client.readyState === ws.OPEN) {
  //         var tickObj = {} 
  //         var tick = { dateStr };
  //         tickObj.tick = tick;
  //         client.send(JSON.stringify(tickObj));
  //       }
  //     });
  //   },
  //   10000
  // )
  })
});

app.listen(3000, function(){
    console.log("Server started at port 3000");
});