if (process.env.NODE_ENV !== 'production'){
    require('dotenv').config()   
}

const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const mongoose = require('mongoose')
const cors = require('cors')
const {getChatRooms} = require('./dbAccess')

var serverHealth={}
var clients = {}

//socket events start ----------------------------------------------------------------------------------------------
io.on('connection', socket => {
  var user_ID=null
  console.log('user connected: '+socket.id);
    
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
  socket.on('login',async(userID)=>{
    // clients[userID] = socket
    // user_ID = userID
   
    // //joining to rooms
    //   var rooms = await getChatRooms(userID)
    //   console.log(rooms.length);
    //   rooms.forEach(element => {
    //     socket.join(element)
    //     // socket.to(element).emit('userOnline',userID)
    //   });
    //   console.log('user joined to rooms'); 
  })  
  
   
  //on user disconneting
  // socket.on('disconnect',async()=>{
  //   if(user_ID){
  //     try{
  //       var rooms = await getChatRooms(user_ID)
  //       rooms.forEach(element => {
  //         socket.to(element).emit('offline',user_ID)
  //       });
  //       delete clients[user_ID]
  //     }catch(e){
  
  //     }
  //   }
  //   console.log('available users = '+clients);
  // })

})
//socket events end ----------------------------------------------------------------------------------------------

//databse connection

// mongoose.connect(process.env.DATABASE_URL,{
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   useFindAndModify: false, 
//   useCreateIndex: true}) 
// const db = mongoose.connection 
// db.on('error', (error) =>{
//   serverHealth.databaseConnection='connection fail' 
//   console.log('error')
// })
// db.once('open', ()=> {
//   serverHealth.databaseConnection='connection success'
//   console.log('connected to mongoose')
// }) 



app.use(cors())
app.use(express.json())
// REST end points start -------------------------------------------------------------------------------------------------------

// check live server health
app.get('/',(req,res)=>{
  try{
    res.status(200).json(serverHealth)
  }catch(e){
    res.status(400).json({message:'something wrong'}) 
  }
})

// get message from message server
app.post('/message',(req,res)=>{
  console.log('new message from message server...........',req.body);
    try{
      io.to(req.body.chatroom_id).emit('message',{message:req.body})
      res.status(200).json({message:'done'})
    }catch(e){
      res.status(400).json({message:'error'})
    }
})

//create new chat room
app.post('/chatroom',(req,res)=>{
  try{
    var users = req.body.users
    users.forEach(userID=>{
      var socketOB = clients[userID]
      if(socketOB){
        socketOB.join(req.body.chatID)
      }
    })
    res.status(200).json({message:'done'})
  }catch(e){
    res.status(400).json({message:'error'})
  }
  
})
// REST end points end -------------------------------------------------------------------------------------------------------


//server listen
http.listen(4000, function() {
  console.log('listening on port 4000')
  serverHealth.message='server is running'
})


