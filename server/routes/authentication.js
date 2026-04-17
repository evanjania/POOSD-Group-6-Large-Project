import express from 'express';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import {ObjectId} from 'mongodb';
const router = express.Router();

/* Refresh user access token using refresh token
Pre: Request contains user's refresh token
Post: Response contains new access token for user */
router.post('/refresh', async (req, res) => {
    const refreshToken = req.body.refreshToken;
    if(refreshToken == null)
        return res.status(401).json({ error: "No refresh token" });

    try{
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await req.db.collection("users").findOne({
            _id: new ObjectId(decoded.userId),
            refreshToken
        });

        if(!user)
            return res.status(403).json({ error: "No user found" });

        const newAccessToken = generateAccessToken({ 
            userId: user._id, 
            username: user.username 
        });

        res.json({ accessToken: newAccessToken });
    }
    catch(err){
        console.log("ERROR REFRESHING TOKEN: ", err);
        res.status(403).json({ error: "Error refreshing token" })
    }
});

/* Logout user
Pre: Request contains user's refresh token
Post: Removes refresh token from database */
router.delete('/logout', async (req, res) => {
    const refreshToken = req.body.refreshToken;

    await req.db.collection("users").updateOne(
        { refreshToken },
        { $unset: { refreshToken: "" } }
    );

    res.status(204).json({ message: "User is successfully logged out" });
});

// Register API
router.post('/register', async (req, res, next) =>{
    try{
        const { fullname, username, email, password } = req.body;
        // simple check
        if (!fullname || !username || !email || !password) {
            return res.status(400).json({ error: "Fill in all fields" });
        }

        // Create db connection
        const db = req.db;
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

        // Create tokens
        const accessToken = generateAccessToken({ 
                userId: result.insertedId, 
                username: username 
            });

        const refreshToken = generateRefreshToken({ userId: result.insertedId, });

        // Save refresh token to database
        await db.collection("users").updateOne(
            { _id: result.insertedId },
            { $set: { refreshToken } }
        );

        res.status(201).json({ 
            message: "Done!",
            accessToken,
            refreshToken,
            id: result.insertedId, 
            username: username 
        });

    }catch(err){
        console.error("REGISTER ERROR:", err);
        return res.status(500).json({error: "Server error during register"});
    }
    
});

// Login API
router.post("/login", async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res
            .status(400)
            .json({ error: "Please enter both username and password" });
        }

        // Create db connection
        const db = req.db;
        const user = await db.collection("users").findOne({
            username: username,
            password: password,
        });

        if (!user) {
            return res
            .status(401)
            .json({ error: "Invalid username or password" });
        }

        // Create tokens
        const accessToken = generateAccessToken({ 
                userId: user._id, 
                username: username 
            });

        const refreshToken = generateRefreshToken({ userId: user._id, });

        // Save refresh token to database
        await db.collection("users").updateOne(
            { _id: user._id },
            { $set: { refreshToken } }
        );

        return res.status(200).json({
            accessToken,
            refreshToken,
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


// Forgot password
router.post("/forgot-pass", async (req, res, next) => {
    try{
        const {email} = req.body;
        if(!email)
            return res.status(400).json({error: "Please enter your email"});
        
        // Create db connection
        const db = req.db;
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

        const resetUrl = `http://localhost:5173/reset-pass/${token}`;
        // Transporter object for email verification
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT, 
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        
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
router.post("/reset-pass", async (req, res, next) => {
    try{
        const {token, newPass} = req.body;

        if(!token || !newPass)
            return res.status(400).json({error: "Missing data."});

        // Create db connection
        const db = req.db;
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

// Returns access token for user with an expiration time
function generateAccessToken(user){
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
}

// Returns refresh token for user, no expiration time
function generateRefreshToken(user){
    return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
}

export default router;