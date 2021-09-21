if (process.env.NODE_ENV !== 'production'){
  require('dotenv').config()
}


const express = require('express');
const aws = require('aws-sdk')
AWS.config.update({region:'ap-southeast-1'});
const app = express();
const client = new aws.ApiGatewayManagementApi({endpoint:process.env.ENDPOINT})
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

app.post('/message',async(req,res)=>{
  clients[req.body.connectionID] = req.body.connectionID 
  console.log(clients);
  console.log('message route', req.body);
  try{
    await client.postToConnection({
      ConnectionId:req.body.data.message,
      Data:Buffer.from(JSON.stringify({message:'reply from server'}))
    }).promise()
    res.status(200).send(JSON.stringify({message:'reply message'})) 
  }catch(e){
    console.log(e);
    res.status(200).send(JSON.stringify({message:'reply message with error'})) 
  }
  
})

app.listen(process.env.PORT || port, function() {
  console.log(`Server is listening on ${port}!`)
})

