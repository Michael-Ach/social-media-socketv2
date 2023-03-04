const dotenv = require("dotenv");
dotenv.config();

const io = require("socket.io")(process.env.PORT, {
    allowRequest: (req, callback) => {
        const noOriginHeader = req.headers.origin === undefined;
        callback(null, noOriginHeader);
    }
});

let users = [];

const addUser = (userId, socketId)=>{
    // If user does not already exist in the users array, add it. 
    !users.some((user) => user.userId === userId) && users.push({userId, socketId})   
}

const removeUser = (socketId)=>{
    users = users.filter(user => user.socketId !== socketId);
}

const getUser = (userId)=>{
    return users.find(user => user.userId === userId);
}

io.on("connection", (socket) =>{
    // When user connects
    console.log("A user connected.");

    // take userId and socketId from  user
    socket.on("addUser", (userId)=>{
        addUser(userId, socket.id);
        console.log("yh", users);
        io.emit("getUsers", users);
    });

    // Send and get message
    socket.on("sendMessage", ({ senderId, receiverId, text}) =>{
        const receiver = getUser(receiverId);
        console.log(receiver, 'user');
        if(receiver){
            io.to(receiver.socketId).emit("getMessage", {
                senderId,
                text,
            });   
        }
    });

    // Send notification
    socket.on("sendNotification", ({conversationId, senderId, senderName, receiverId}) => {
		const receiver = getUser(receiverId);
		io.to(receiver?.socketId).emit("getNotification", {
			senderId,
			senderName,
            conversationId,
            receiverId,
		})
	});


    // When user disconnects
    socket.on('disconnect', ()=>{
        console.log('A user disconnected!');
        removeUser(socket.id);
        io.emit("getUsers", users);
    });
});