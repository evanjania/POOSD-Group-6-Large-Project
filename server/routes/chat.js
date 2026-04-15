import express from 'express';
import {ObjectId} from 'mongodb';
const router = express.Router();

// Chat Api
io.on('connection', (socket) => {
    console.log(`User connected', ${socket.id}`);
    socket.on('join_chat', (data) => {
        socket.join(data.roomId);
        console.log(`User joined room: ${data.roomId}`);
    });

    socket.on("send_message", async (data) => {
        const { senderId, receiverId, messageText, type, recPayload } = data;
        
        const message = {
            senderId: new ObjectId(data.senderId),
            receiverId: new ObjectId(data.receiverId),
            messageText: messageText,
            type: type || "text",
            recPayload: recPayload || null, // Only exists if type is "rec"
            createdAt: new Date().toISOString(),
            isRead: false,
        }
        
        try{
            const db = client.db(dbName);
            const result = await db.collection("messages").insertOne(message);

            const messageWithId = { ...message, id: result.insertedId };

            const roomId = [senderId, receiverId].sort().join("_");
            io.to(roomId).emit("receive_message", messageWithId);
        }catch(err){
            console.error("Failed to save message", err);
        }
    });

    socket.on("disconnect", () =>{
        console.log("User disconnected");
    });

});

//Load history
router.get("/:currentUserId/:friendId", async (req, res, next) => {
    try {
        const { currentUserId, friendId } = req.params;
        const db = client.db(dbName);

        const userA = new ObjectId(currentUserId);
        const userB = new ObjectId(friendId);

        const chatHistory = await db.collection("messages").find({
            $or: [
                { senderId: userA, receiverId: userB },
                { senderId: userB, receiverId: userA }
            ]
        })
        .sort({ createdAt: 1 }) //display oldest message first
        .toArray();

        const formattedHistory = chatHistory.map(msg => ({
            ...msg,
            id: msg._id,
        }));

        res.status(200).json(formattedHistory);
    } catch (err) {
        console.error("FETCH MSG ERROR:", err);
        res.status(500).json({ error: "Could not load messages" });
    }
});

router.post("/mark-read", async (req, res) => {
    try {
        const { currentUserId, friendId } = req.body;
        const db = client.db(dbName);

        await db.collection("messages").updateMany(
            { 
                senderId: new ObjectId(friendId), 
                receiverId: new ObjectId(currentUserId),
                isRead: false 
            },
            { $set: { isRead: true } }
        );

        res.status(200).json({ message: "Messages marked as read" });
    } catch (err) {
        res.status(500).json({ error: "Failed to update read status" });
    }
});

export default router;