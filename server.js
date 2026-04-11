import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import bodyParser from 'body-parser';
import cors from 'cors';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Place in root of mern app with package.json

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const url = 'mongodb+srv://kevin:kevin123@largeprojectcluster.xezylnw.mongodb.net/largeProjectDB?appName=LargeProjectCluster';
const client = new MongoClient(url);
const dbName = 'largeProjectDB'

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

app.use((req, res, next) => {
    console.log('EXPRESS HIT:', req.method, req.url);
    next();
});

// Forgot password
app.post("/api/forgot-pass", async (req, res, next) => {
    try{
        const {email} = req.body;
        if(!email)
            return res.status(400).json({error: "Please enter your email"});
        
        const db = client.db(dbName);
        const users = db.collection("users");
        const user = await users.findOne({email});

        if(!user){
            return res.status(200).json({message: "A reset link was sent if an account exists"});
        }

        const token = crypto.randomBytes(20).toString('hex');
        const expires = Date.now() + 300000; // 5 mins

        await users.updateOne(
            {_id: user._id },
            { $set: {
                resetToken: token,
                resetExpires: expires
            }}
        );

        const resetUrl = `${process.env.CLIENT_URL}/reset-pass/${token}`;

        await transporter.sendMail({
            from: '"UGotta Team" <no-reply@ugotta.space>',
            to: user.email,
            subject: 'UGotta - Password Reset',
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2>Password Reset Request</h2>
                    <p>Tired of forgetting recommendations? Let's get you back in.</p>
                    <p>Click the button below to reset your password. This link expires in 5 minutes.</p>
                    <a href="${resetUrl}" style="background: #1149A8; color: white; padding: 12px 20px; text-decoration: none; border-radius: 8px; display: inline-block;">Reset Password</a>
                </div>
            `
        });

        res.status(200).json({message: "Reset link sent to your email"});
    }catch(err){
        console.error("FORGOT PASSWORD ERROR: ",err);
        res.status(500).json({error: "Server error"});
    }
});

// Reset password
app.post("/api/reset-pass", async (req, res, next) => {
    try{
        const {token, newPass} = req.body;

        if(!token || !newPass)
            return res.status(400).json({error: "Missing data."});

        const db = client.db(dbName);
        const users = db.collection('users');
        const user = await users.findOne({
            resetToken: token,
            resetExpires: { $gt: Date.now() }
        });

        if(!user)
            return res.status(400).json({error: "Token is invalid or expired."});

        await users.updateOne(
            { _id: user._id},
            { 
                $set: { password: newPass},
                $unset: { resetToken: "", resetExpires: ""}
            }
        );

        res.status(200).json({message: "Password updated successfully. You can now log in"});

    }catch(err){
        console.error("RESET ERROR:",err);
        res.status(500).json({error: "Server error"});
    }

});

// Login API
app.post("/api/login", async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res
            .status(400)
            .json({ error: "Please enter both username and password" });
        }

        const db = client.db(dbName);
        const user = await db.collection("users").findOne({
            username: username,
            password: password,
        });

        if (!user) {
            return res
            .status(401)
            .json({ error: "Invalid username or password" });
        }

        return res.status(200).json({
            id: user._id,
            username: user.username,
            fullname: user.fullname,
            email: user.email,
            error: "",
        });

    } catch (err) {
        console.error("LOGIN ERROR:", err);
        return res.status(500).json({ error: "Server error during login" });
    }
});

// Register API
app.post('/api/register', async (req, res, next) =>{
    try{
        const { fullname, username, email, password } = req.body;
        // simple check
        if (!fullname || !username || !email || !password) {
            return res.status(400).json({ error: "Fill in all fields" });
        }

        const db = client.db(dbName);
        const users = db.collection('users');

        // check if email or username are taken
        const existingUser = await users.findOne({ 
            $or: [{ email: email }, { username: username }] 
        });

        if (existingUser) {
            if (existingUser.username === username) {
                return res.status(400).json({ error: "Username already taken" });
            }
            if (existingUser.email === email) {
                return res.status(400).json({ error: "Email already taken" });
            }
        }

        const result = await users.insertOne({
            fullname,
            username,
            email,
            password
        });

        res.status(201).json({ 
            message: "Done!", 
            id: result.insertedId, 
            username: username 
        });

    }catch(err){
        console.error("REGISTER ERROR:", err);
        return res.status(500).json({error: "Server error during register"});
    }
    
});

// Search Users
app.get("/api/users/search", async (req, res, next ) => {
    try {
        const query = req.query.q;
        
        if (!query) {
            return res.status(200).json([]);
        }

        const db = client.db(dbName);
        
        // find users where username matches the query partially
        const users = await db.collection("users").find({
            username: { $regex: query, $options: "i" }
        })
        .project({ password: 0 }) //not sending passwords to the frontend
        .limit(10) //limit to 10 results for now
        .toArray();

        res.status(200).json(users);
    } catch (err) {
        console.error("SEARCH ERROR:", err);
        res.status(500).json({ error: "Server error during search" });
    }
});

// Send a follow request
app.post('/api/follow/request', async (req, res, next) =>{
    try{
        const { followerId, followingId } = req.body;

        if(!followerId || !followingId)
            return res.status(400).json({error: "Missing user IDs"});

        const db = client.db(dbName);
        const follows = db.collection("follows");

        const followerObjId = new ObjectId(followerId);
        const followingObjId = new ObjectId(followingId);

        const existingFollow = await follows.findOne({ followerId: followerObjId, followingId: followingObjId});

        if(existingFollow){
            return res.status(400).json({ error: "Users may be already connected" });
        }

        const newRequest = {
            followerId: followerObjId,
            followingId: followingObjId,
            status: "pending",
            createdAt: new Date()
        };

        const result = await follows.insertOne(newRequest);
        
        res.status(201).json({ message: "Follow Request Sent", id: result.insertedId })

    }catch(err){
        console.error("FOLLOW REQUEST ERROR:",err);
        res.status(500).json({ error: "Server error"});
    }
});

// GET pending follow requests for a specific user
app.get('/api/follow/pending/:userId', async (req, res, next) => {
    try {
        const { userId } = req.params;
        const db = client.db(dbName);

        // fetch requests and join the users collection to get the sender's username
        const pendingRequests = await db.collection("follows").aggregate([
            { 
                $match: { 
                    followingId: new ObjectId(userId), 
                    status: "pending" 
                } 
            },
            {
                $lookup: {
                    from: "users",
                    localField: "followerId", // the ID in the follows collection
                    foreignField: "_id", // the ID in the users collection
                    as: "requesterInfo"
                }
            },
            { $unwind: "$requesterInfo" }, // flattens the array
            {
                // Only return the data the frontend actually needs
                $project: {
                    _id: 1, // This is the requestId needed for approve/deny!
                    followerId: 1,
                    username: "$requesterInfo.username",
                    fullname: "$requesterInfo.fullname",
                    createdAt: 1
                }
            }
        ]).toArray();

        res.status(200).json(pendingRequests);
    } catch (err) {
        console.error("FETCH PENDING ERROR:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Approve a follow request
app.post('/api/follow/approve', async (req, res, next) => {
    try{
        const { requestId } = req.body;
        if (!requestId) {
            return res.status(400).json({ error: "Missing request ID" });
        }

        const db = client.db(dbName);
        
        // update the status
        const result = await db.collection("follows").updateOne(
            { _id: new ObjectId(requestId) },
            { $set: { status: "accepted" } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "Follow request not found" });
        }

        res.status(200).json({ message: "Request approved" });
    }catch(err){
        console.error("APPROVE ERROR:", err);
        res.status(500).json({ error: "Server error" });
    }
});

//Deny a follow
app.post('/api/follow/deny', async (req, res, next) => {
    try {
        const { requestId } = req.body;

        if (!requestId) {
            return res.status(400).json({ error: "Missing request ID" });
        }

        const db = client.db(dbName);
        
        //delete the document so the database stays clean
        const result = await db.collection("follows").deleteOne({ 
            _id: new ObjectId(requestId) 
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Follow request not found" });
        }

        res.status(200).json({ message: "Request denied and removed" });
    } catch (err) {
        console.error("DENY ERROR:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Remove a friend
app.post('/api/follow/remove', async (req, res, next) => {
    try {
        const { currentUserId, friendId } = req.body;

        if (!currentUserId || !friendId) {
            return res.status(400).json({ error: "Missing user IDs" });
        }

        const db = client.db(dbName);
        
        //delete the relationship in either direction
        const result = await db.collection("follows").deleteMany({
            $or: [
                { followerId: new ObjectId(currentUserId), followingId: new ObjectId(friendId) },
                { followerId: new ObjectId(friendId), followingId: new ObjectId(currentUserId) }
            ]
        });

        res.status(200).json({ message: "Friend removed successfully" });
    } catch (err) {
        console.error("REMOVE FRIEND ERROR:", err);
        res.status(500).json({ error: "Server error" });
    }
});
// GET all accepted friends for a user
app.get('/api/follow/friends/:userId', async (req, res,next ) => {
    try {
        const { userId } = req.params;
        const db = client.db(dbName);
        const userObjId = new ObjectId(userId);

        const friends = await db.collection("follows").aggregate([
            { 
                $match: { 
                    status: "accepted",
                    $or: [ { followerId: userObjId }, { followingId: userObjId } ]
                } 
            },
            {
                // Figure out who the "other" person is in this relationship
                $addFields: {
                    friendId: {
                        $cond: {
                            if: { $eq: ["$followerId", userObjId] },
                            then: "$followingId",
                            else: "$followerId"
                        }
                    }
                }
            },
            {
                // Look up the other person's details in the Users collection
                $lookup: {
                    from: "users",
                    localField: "friendId",
                    foreignField: "_id",
                    as: "friendInfo"
                }
            },
            { $unwind: "$friendInfo" },
            {
                // Return exactly what the Dashboard frontend expects
                $project: {
                    _id: 0,
                    id: "$friendInfo._id",
                    username: "$friendInfo.username"
                }
            }
        ]).toArray();

        res.status(200).json(friends);
    } catch (err) {
        console.error("FETCH FRIENDS ERROR:", err);
        res.status(500).json({ error: "Server error" });
    }
});

app.listen(5000); // start Node + Express server on port 5000