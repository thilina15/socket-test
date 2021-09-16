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

app.use(express.json())

app.get('/',(req,res)=>{
  console.log('home');
  res.send('home route')
})

app.post('/message',(req,res)=>{
  console.log(req);
  console.log('message route', req.body);
  res.send('inside message route')
})

server.listen(process.env.PORT || port, function() {
  console.log(`Server is listening on ${port}!`)
})

