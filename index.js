const express = require('express');
const app = express();

const port = 6969;

var clients = {}



app.use(express.json())

app.get('/',(req,res)=>{
  console.log('home');
  res.send('home route')
})

app.post('/connect',(req,res)=>{
  clients[req.body.connectionID] = req.body.connectionID 
  res.status(200)
})


app.post('/disconnect',(req,res)=>{
  delete clients[req.body.connectionID]
  res.status(200).send(JSON.stringify({message:'hello world'})) 
})

app.post('/message',(req,res)=>{
  clients[req.body.connectionID] = req.body.connectionID 
  console.log(clients);
  console.log('message route', req.body);
  res.status(200).send(JSON.stringify({message:'reply message'})) 
})

app.listen(process.env.PORT || port, function() {
  console.log(`Server is listening on ${port}!`)
})

