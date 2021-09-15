const express = require('express');
const app = express();
const http = require('http');
const WebSocket = require('ws');

const port = 6969;
const server = http.createServer(app);
const wss = new WebSocket.Server({ server })

wss.on('connection', function connection(ws) {
  console.log('client connected');
  ws.socketID = 'user_id'
  console.log(wss.clients.size);
  ws.on('message', function incoming(data) {
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    })
  })
})

app.get('/',(req,res)=>{
  res.send('server is tunning....')
})


server.listen(process.env.PORT || port, function() {
  console.log(`Server is listening on ${port}!`)
})

