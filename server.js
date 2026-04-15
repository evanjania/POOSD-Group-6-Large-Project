import express from 'express';
import { MongoClient } from 'mongodb';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';

// Routers
import recRouter from './routes/recommendations.js';
import authRouter from './routes/authentication.js';
import followRouter from './routes/follow.js';
import sendRecommendationRouter from './routes/sendRecommendation.js'//kevin edit

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

// Route handlers
app.use('/api/recs', recRouter);
app.use('/api/auth', authRouter);
app.use('/api/follow', followRouter);
app.use('/api/sendRecommendation', sendRecommendationRouter)//kevin edit

app.listen(5000);