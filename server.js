console.log("NEW VERSION HIT");

import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log("EXPRESS HIT:", req.method, req.url);
  next();
});

// Database
const url =
  "mongodb+srv://kevin:kevin123@largeprojectcluster.xezylnw.mongodb.net/largeProjectDB?retryWrites=true&w=majority&appName=LargeProjectCluster";

const client = new MongoClient(url);
const DB_NAME = "largeProjectDB";

async function startServer() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");

    // LOGIN
    app.post("/api/login", async (req, res) => {
      try {
        const { username, password } = req.body;

        if (!username || !password) {
          return res
            .status(400)
            .json({ error: "Please enter both username and password" });
        }

        const db = client.db(DB_NAME);
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

    // REGISTER
    app.post("/api/register", async (req, res) => {
      try {
        const { fullname, username, email, password } = req.body;

        if (!fullname || !username || !email || !password) {
          return res.status(400).json({ error: "Fill in all fields" });
        }

        const db = client.db(DB_NAME);
        const users = db.collection("users");

        const existingUser = await users.findOne({
          $or: [{ email: email }, { username: username }],
        });

        if (existingUser) {
          return res
            .status(400)
            .json({ error: "Email or username already taken" });
        }

        const result = await users.insertOne({
          fullname,
          username,
          email,
          password,
        });

        return res.status(201).json({
          message: "Done!",
          id: result.insertedId,
        });
      } catch (err) {
        console.error("REGISTER ERROR:", err);
        return res.status(500).json({ error: "Server error during registration" });
      }
    });

    // TEST ROUTE
    app.get("/api/health", (req, res) => {
      res.status(200).json({ status: "ok" });
    });

    app.listen(5000, () => {
      console.log("Server running on port 5000");
    });
  } catch (err) {
    console.error("Mongo connection failed:", err);
  }
}

startServer();