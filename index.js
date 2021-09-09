if (process.env.NODE_ENV !== 'production'){
  require('dotenv').config()   
}

const fs = require('fs')
const path = require('path')
const morgan = require('morgan')
const logger = require('socket.io-logger')
const util = require('util')
const express = require('express')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server,{
cors:{
  origin:'*',
  methods:['GET', 'POST', 'PUT']
}
})
const mongoose = require('mongoose')
const cors = require('cors')
const {getChatRooms} = require('./dbAccess')

var serverHealth={}
var clients = {}

//logger details....................................................................................................
var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })
app.use(morgan('combined', { stream: accessLogStream }))

var options = {stream: fs.createWriteStream(path.join(__dirname, 'events.log'),{flags:'a'}) };
io.use((socket,next)=> {
logger(options)
next()
});

//socket events start ----------------------------------------------------------------------------------------------
io.on('connection', socket => {
console.log('user connected');
var user_ID=null
var user_email = null
  
//on typing user
socket.on('typing',(chat)=>{
  socket.to(chat.chatroom_id).emit('typing',chat)
})

//on typingEnd user
socket.on('typingEnd',(chat)=>{
  socket.to(chat.chatroom_id).emit('typingEnd',chat)
})

 //on active status
 socket.on('activeStatus',(user_id,status)=>{
    var requestedUserOB = clients[user_id]
    if(requestedUserOB){
      status('online')
    }else{
      status('offline')
    }
})

//on login user
socket.on('login',async(userID,email)=>{
  
  // socket.join('test')
  console.log('new user joining.......... ', email);
  clients[userID] = socket
  user_ID = userID
  user_email = email
 
  //joining to rooms
    var rooms = await getChatRooms(userID)
    console.log('total chatromms for user: ',rooms.length);
    rooms.forEach(element => {
      socket.join(String(element))
      socket.to(String(element)).emit('online',userID) //send online notification to other chat rooms
    });
    console.log('user login successfully.. ', email); 
})  

 //on logout
 socket.on('logout',async()=>{ 
  if(user_ID){
    try{
      var rooms = await getChatRooms(user_ID)
      rooms.forEach(element => {
        socket.to(String(element)).emit('offline',user_ID) //send offline notification to other chat rooms
      });
      delete clients[user_ID]
    }catch(e){

    }
  }
  console.log('user logout ', user_email);
})   

//on user disconneting
socket.on('disconnect',async(reason)=>{
  console.log('user disconnecting for reason ',reason);
  if(user_ID){
    try{
      var rooms = await getChatRooms(user_ID)
      rooms.forEach(element => {
        socket.to(element).emit('offline',user_ID) //send offline notification to other chat rooms
      });
      delete clients[user_ID]
    }catch(e){

    }
    console.log('user disconnected ', user_email);
  }
})

})
//socket events end ----------------------------------------------------------------------------------------------

//databse connection

mongoose.connect(process.env.DATABASE_URL,{
useNewUrlParser: true,
useUnifiedTopology: true,
useFindAndModify: false, 
useCreateIndex: true}) 
const db = mongoose.connection 
db.on('error', (error) =>{
serverHealth.databaseConnection='connection fail' 
console.log('error')
})
db.once('open', ()=> {
serverHealth.databaseConnection='connection success'
console.log('connected to mongoose')
}) 



app.use(cors())
app.use(express.json())
// REST end points start -------------------------------------------------------------------------------------------------------

//get online connected users
app.get('/users',(req,res)=>{
try{
  res.status(200).send(util.inspect(clients))
}catch(e){
  res.status(500).json({message:'something wrong'}) 
}
})

//get all rooms
app.get('/rooms',(req,res)=>{
try{
  let rooms = 0
  var roomsMap = io.sockets.adapter.rooms
  roomsMap.forEach((value,key)=>{
    rooms++
  })

  res.status(200).json(rooms)
}catch(e){
  res.status(500).json({message:'something wrong'}) 
}
})

// check live server health
app.get('/',(req,res)=>{
try{
  res.status(200).json(serverHealth)
}catch(e){
  res.status(500).json({message:'something wrong'}) 
}
})

// get message from message server
app.post('/message',(req,res)=>{
console.log('new message from message server...........',req.body);
  try{
    io.to(req.body.chatroom_id).emit('message',{message:req.body})
    console.log('message sent to chatroom');
    res.status(200).json({message:'done'})
  }catch(e){
    console.log('message send error');
    res.status(400).json({message:'error'})
  }
})

//create new chat room
app.post('/chatroom',(req,res)=>{
console.log('new chat room request');
try{
  var users = req.body.users
  users.forEach(userID=>{
    var socketOB = clients[userID]
    if(socketOB){
      socketOB.join(String(req.body.chatID))
    }
  })
  res.status(200).json({message:'done'})
  console.log('chatroom created ');
}catch(e){
  res.status(400).json({message:'error'})
  console.log('chatroom created error');
}

})

//download socket logs 
app.post('/socketlog',(req,res)=>{
const file = path.join(__dirname, 'events.log')
res.download(file)
})

//download REST logs 
app.post('/restlogs',(req,res)=>{
const file = path.join(__dirname, 'access.log')
res.download(file)
})

// REST end points end -------------------------------------------------------------------------------------------------------


//server listen
server.listen(process.env.PORT || 4000, function() {
console.log('listening on port 4000')
serverHealth.message='server is running'
})


