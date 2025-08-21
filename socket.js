const { Server } = require("socket.io");
let IO;
let usersJoin={}
const connectedUsers = {};
module.exports.initIO = (httpServer) => {
  IO = new Server(httpServer, {
    cors: {
      origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  IO.use((socket, next) => {
    if (socket.handshake.query) {
      let callerId = socket.handshake.query.callerId;
      socket.user = callerId;
      console.log('callerid',callerId)
      next();
    }
  });

  IO.on("connection", (socket) => {
    console.log(socket.user, "Connected");
    socket.join(socket.user);

    socket.on("call", (data) => {
      let calleeId = data.calleeId;
      let rtcMessage = data.rtcMessage;
console.log('calling',data)


      socket.to(calleeId).emit("newCall", {
        callerId: socket.user,
        rtcMessage: rtcMessage,
      });
    });



    socket.on("groupCall", (data) => {
      let calleeId = data.calleeId;
      let rtcMessage = data.rtcMessage;
console.log('calling',data)

calleeId.map((coller_ids)=>{
  socket.to(coller_ids).emit("newCall", {
    callerId: socket.user,
    rtcMessage: rtcMessage,
  });
})
      
    });

    socket.on("answerCall", (data) => {
      let callerId = data.callerId;
      rtcMessage = data.rtcMessage;

      socket.to(callerId).emit("callAnswered", {
        callee: socket.user,
        rtcMessage: rtcMessage,
      });
    });

    socket.on("ICEcandidate", (data) => {
      console.log("ICEcandidate data.calleeId", data.calleeId);
      let calleeId = data.calleeId;
      let rtcMessage = data.rtcMessage;
      console.log("socket.user emit", socket.user);

      socket.to(calleeId).emit("ICEcandidate", {
        sender: socket.user,
        rtcMessage: rtcMessage,
      });
    });
    console.log("A user connected=",socket.id);
    socket.on('userLoggedIn', ({ userId }) => {
        console.log(`User logged in: ${userId}`);
        usersJoin[socket.id] = userId;
        IO.emit('userStatusChanged', { userId, status: 'online' });
      });

    socket.on('joinRoom',(room)=>{
        console.log("joing for room is ",room)
        socket.join(room);
	 if(!usersJoin[socket.id]){
             usersJoin[socket.id]=room
          }
          IO.to(room).emit("online message",{socket:socket.id},{online:true},)
     })
	socket.on('online message',(room)=>{
        IO.to(room).emit('online message1',{ online: true, time: new Date().toLocaleTimeString() })
         })
         socket.on('typing', (data) => {
            console.log('typing...', data[0].room,data[0].socket);
            IO.to(data[0].room).emit('typing1', data);
          });
        
          socket.on('stopTyping', (data) => {
            console.log('stoptyping...', data[0].room,data[0].socket);
            IO.to(data[0].room).emit('stopTyping1', data);
          });
        
    socket.on('getcontact',(data)=>{
        console.log('getcontact',data)
        IO.emit('getcontact',data)
     })
    socket.on('message',(data)=>{
        // Persist one-to-one message to DB, then broadcast
        console.log('socket message1', data);
        const { room_id, chatId, content, senderMobile } = data;
        // Prefer chatId if present, else fallback to room_id for backward compatibility
        const resolvedChatId = chatId || room_id;
        if (!resolvedChatId || !content || !senderMobile) {
          socket.emit('error', { message: 'chatId (or room_id), content, and senderMobile are required.' });
          return;
        }
        require('./controllers/chatController').saveInstantMessageToDB({ chatId: resolvedChatId, content, senderMobile })
          .then(savedMessage => {
            IO.to(resolvedChatId).emit('messageSend', savedMessage);
          })
          .catch(err => {
            socket.emit('error', { message: err.message });
          });
       })
       socket.on('groupmessage',(data)=>{
      // Persist group message to DB, then broadcast
      console.log('groupmessage', data);
      const { room_id, groupId, sender, content, messageType } = data;
      const resolvedGroupId = groupId || room_id;
      if (!resolvedGroupId || !sender || !content) {
        socket.emit('error', { message: 'groupId (or room_id), sender, and content are required.' });
        return;
      }
      require('./controllers/groupController').saveInstantGroupMessageToDB({ groupId: resolvedGroupId, sender, content, messageType })
        .then(savedMessage => {
          IO.to(resolvedGroupId).emit('groupmessage', savedMessage);
        })
        .catch(err => {
          socket.emit('error', { message: err.message });
        });
    })
           socket.on('groupimage',(data)=>{
            console.log('groupimage',data)
            IO.to(data.room_id).emit('groupimage',{ ...data})
         })

           socket.on('groupvideo',(data)=>{
            console.log('groupvideo',data)
            IO.to(data.room_id).emit('groupvideo',{ ...data })
         })
         
socket.on('groupaudio',(data)=>{
    console.log('groupaudio',data)
    IO.to(data.room_id).emit('groupaudio',{ ...data })
 })
socket.on('groupdocument',(data)=>{
    console.log('groupdocument',data)
    IO.to(data.room_id).emit('groupdocument',{ ...data})
 })
    socket.on('getmessage',(result)=>{
        console.log('socket message1',data)
        IO.to(data.room_id).emit('getmessage',{ ...data })
}) 
socket.on('user video',data=>{
    console.log("image",data)
    IO.to(data.room_id).emit('user video',{ ...data })
})
    socket.on('user gallery',data=>{
        console.log("image",data)
        IO.to(data.room_id).emit('user gallery',{ ...data})
    }) 
    socket.on('user document',data=>{
        console.log("image",data)
        IO.to(data.room_id).emit('user document',{ ...data})
    })
    
    socket.on('user audio',data=>{
        console.log("image",data)
        IO.to(data.room_id).emit('user audio',{ ...data})
    })
    socket.on('user camera',data=>{
        console.log("image",data)
        IO.to(data.room_id).emit('user camera',{ ...data})
    })
    socket.on('user location',data=>{
      console.log("location",data)
      IO.to(data.room_id).emit('user location1',{ ...data})
  })

  socket.on('group location',data=>{
    console.log("location",data)
    IO.to(data.room_id).emit('group location1',{ ...data})
})
   
      socket.on('contacts',data=>{
        console.log("contacts",data)
        IO.to(data.room_id).emit('contacts1',{ ...data })
    }) 

    // Handling login event when a user joins
    socket.on('send', message => {
      if (message.type === 'login') {
        connectedUsers[message.name] =socket.id;
        console.log('User logged in:', message.name );
        console.log('connectedUsers', connectedUsers );
      }
    });
  
    // Handling offer event when someone initiates a call
    socket.on('send', message => {
      if (message.type === 'offer') {
        const recipientSocketId = connectedUsers[message.callee];
        if (recipientSocketId) {
            IO.to(recipientSocketId).emit('send1', message);
          console.log('Sending offer to:', message.callee,recipientSocketId );
        } else {
          console.log('User not found:', message.callee);
        }
      }
    });
  
    // Handling answer event when a user accepts a call
    socket.on('send', message => {
      if (message.type === 'answer') {
        const senderSocketId = connectedUsers[message.caller];
        console.log('senderSocketId', message)
        if (senderSocketId) {
            IO.to(senderSocketId).emit('send1', message);
          console.log('Sending answer to:', message.caller, senderSocketId);
        } else {
          console.log('User not found:', message.caller);
        }
      }
    });
  
    // Handling candidate event to exchange ICE candidates
    socket.on('send', message => {
      if (message.type === 'candidate') {
        const recipientSocketId = connectedUsers[message.name];
        if (recipientSocketId) {
          IO.to(recipientSocketId).emit('send1', message);
          console.log('Sending candidate to:', message.name);
        } else {
          console.log('User not found:', message.name);
        }
      }
    });
  
    // Handling leave event when a user hangs up or leaves the call
    socket.on('send', message => {
      if (message.type === 'leave') {
        const recipientSocketId = connectedUsers[message.name];
        if (recipientSocketId) {
            IO.to(recipientSocketId).emit('send1', message);
          console.log('Sending leave signal to:', message.name);
        } else {
          console.log('User not found:', message.name);
        }
      }
    });


//      socket.on('disconnect',()=>{
//        let id=usersJoin[socket.id]     
//        console.log('user left',id)
//        delete usersJoin[socket.id]
// })

// socket.on('disconnect',()=>{
//     let id=usersJoin[socket.id];
//     let time = new Date().toLocaleString();
//     console.log('user left',id, time);
//     delete usersJoin[socket.id];
//     io.emit('userLeft', {id, time});
//  });
socket.on('disconnect', () => {
    if (usersJoin.hasOwnProperty(socket.id)) {
      const userId = usersJoin[socket.id];
      // let time = new Date().toLocaleString();
      const time = new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });
      delete usersJoin[socket.id];
      IO.emit('userStatusChanged', { userId, time, status: 'offline' });
      console.log(`User logged out: ${userId}`);
    }
  });
  });
};

module.exports.getIO = () => {
  if (!IO) {
    throw Error("IO not initilized.");
  } else {
    return IO;
  }
};
