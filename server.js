import express from 'express';
import { MongoClient } from 'mongodb';
import bodyParser from 'body-parser';
import cors from 'cors';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Routers
import recRouter from './server/routes/recommendations.js';

dotenv.config();

// App object
const app = express();
app.use(cors());
app.use(express.json());

// Database object setup
const url = 'mongodb+srv://kevin:kevin123@largeprojectcluster.xezylnw.mongodb.net/largeProjectDB?appName=LargeProjectCluster';
const client = new MongoClient(url);
await client.connect()
const db = client.db('largeProjectDB')

// Transporter object for email verification
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT, 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

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

// Route handler for recommendations
app.use('/api/recommendations', recRouter)

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

        res.status(201).json({ message: "Done!", id: result.insertedId });

    }catch(err){
        console.error("REGISTER ERROR:", err);
        return res.status(500).json({error: "Server error during register"});
    }
    
});

app.listen(5000); // start Node + Express server on port 5000