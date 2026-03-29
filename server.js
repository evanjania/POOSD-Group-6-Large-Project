import express from 'express';
import { MongoClient } from 'mongodb';
import bodyParser from 'body-parser';
import cors from 'cors';

// Place in root of mern app with package.json

const app = express();
app.use(cors());
app.use(express.json());

const url = 'mongodb+srv://kevin:kevin123@largeprojectcluster.xezylnw.mongodb.net/largeProjectDB?appName=LargeProjectCluster';
const client = new MongoClient(url);
const dbName = 'largeProjectDB'

app.use((req, res, next) => {
    console.log('EXPRESS HIT:', req.method, req.url);
    next();
});

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