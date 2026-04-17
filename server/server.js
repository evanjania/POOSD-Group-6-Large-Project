import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import http from 'http';

// Routers
import recRouter from './routes/recommendations.js';
import authRouter from './routes/authentication.js';
import followRouter from './routes/follow.js';
import messagesRouter from './routes/chat.js';

// App object
const app = express();
app.use(cors());
app.use(express.json());

// Database object setup
const client = new MongoClient(process.env.MONGO_URI);
await client.connect();
const db = client.db('largeProjectDB');

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

// Create http server with Socket.IO server instance for messaging
const server = http.createServer(app);
const io = new Server(server, {
    path: '/api/socket.io',
    cors: {
        origin: "https://ugotta.space",
        methods: ["GET", "POST"]
    }
});

// Authenticate user
io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if(!token){
        return next(new Error("Authentication error: No token"));
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if(err){
            return next(new Error("Authentication error: Invalid token"));
        }

        socket.user = user;
        next();
    });
});

// Chat Api
io.on('connection', (socket) => {
    console.log(`User connected, ${socket.id}`);
    
    socket.on('join_chat', (data) => {
        socket.join(data.roomId);
        console.log(`User joined room: ${data.roomId}`);
    });

    socket.on("send_message", async (data) => {
        const senderId = socket.user.userId;
        const { receiverId, messageText, type, recPayload } = data;
        
        const message = {
            senderId: new ObjectId(senderId), // Secure fix applied here
            receiverId: new ObjectId(receiverId), 
            messageText: messageText,
            type: type || "text",
            recPayload: recPayload || null, //only exists if type is "rec"
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
app.use('/api/auth', authRouter);
app.use('/api/recs', authenticateToken, recRouter);
app.use('/api/follow', authenticateToken, followRouter);
app.use('/api/messages', authenticateToken, messagesRouter);

server.listen(process.env.PORT);

// Middleware for JWS authentication
function authenticateToken(req, res, next){
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if(token == null) 
        return res.status(401).json({ error: "No token"});

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if(err){
            console.log("JWT verification error:", err.message);
            return res.status(403).json({ error: "Invalid token" });
        }

        req.user = user;
        next();
    });
}