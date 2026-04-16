import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import http from 'http';

// Routers
import recRouter from './routes/recommendations.js';
import authRouter from './routes/authentication.js';
import followRouter from './routes/follow.js';
import messagesRouter from './routes/chat.js';

dotenv.config();

// App object
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
    path: "/api/socket.io",
    cors: {
        origin: "https://ugotta.space",
        methods: ["GET", "POST"]
    }
});

// Database object setup
const url = 'mongodb+srv://kevin:kevin123@largeprojectcluster.xezylnw.mongodb.net/largeProjectDB?appName=LargeProjectCluster';
const client = new MongoClient(url);
await client.connect()
const db = client.db('largeProjectDB')

// Log incoming api calls
app.use((req, res, next) => {
    console.log(req.method, req.url);
    next();
});

// Add database object to requests
app.use((req, res, next) => {
    req.db = db;
    next();
});

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

// Route handlers
app.use('/api/recs', recRouter);
app.use('/api/auth', authRouter);
app.use('/api/follow', followRouter);
app.use('/api/messages', messagesRouter);

server.listen(5000);