import express from 'express';
import { MongoClient } from 'mongodb';
const router = express.Router();

// Database info
const url = 'mongodb+srv://kevin:kevin123@largeprojectcluster.xezylnw.mongodb.net/largeProjectDB?appName=LargeProjectCluster';
const client = new MongoClient(url);
const dbName = 'largeProjectDB'

const rec = {
    userId: "",
    title: "",
    category: "",
    description: "",
    location: "",
    rating: 0,
    visibility: "",
}

// Add recommendation
router.post('/add', async (req, res) => {
    try
    {
        // Parse and validate data from request
        const{username, title, category, rating, notes} = req.body;
        if(!username || !title || !category || !rating || !notes)
        {
            return res.status(400).json({error: "Missing data"});
        }

        const db = req.db;
        const recsCollection = db.collection('recommendations')

        // Check for rec with same title and category in database
        const existingRec = await recsCollection.findOne({username, title, category})

        // Check if existingRec title and categroy match
        if(existingRec)
        {
            return res.status(400).json({error: "This user already has a recommendation for this title and category already"})
        }

        // add result
        const result = await recsCollection.insertOne({
            username,
            title,
            category,
            rating,
            notes
        })

        res.status(200).json({message: "Successfully added recommendation!", id: result.insertedId})
    }

    // Handle errors
    catch(err)
    {
        console.error("ERROR ADDING RECOMMENDATION: ", err);
        res.status(500).json({error: "Server error"});
    }
});


export default router;