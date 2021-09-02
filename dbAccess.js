const mongoose = require('mongoose')


function getChatRooms(userID){
    return new Promise((resolve,reject)=>{
        var chatRoomIDs =[]
        var uid = mongoose.Types.ObjectId(userID)
        console.log(uid);
        const db = mongoose.connection.db
    
        db.collection('chat_room').find({members:{$all:[uid]}}).stream()
        .on('data',(doc)=>{
            chatRoomIDs.push(doc._id)
        })
        .on('error',(err)=>{
            reject(err)
        }) 
        .on('end',()=>{
            resolve(chatRoomIDs)
        })
    })


}

module.exports = { 
    getChatRooms:getChatRooms
}    