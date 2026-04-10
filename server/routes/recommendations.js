import express from 'express';
import {ObjectId} from 'mongodb';
const router = express.Router();

/* Add recommendation
Pre: Request contains, username, title, category, rating and notes, all as strings
Post: Creates a recommendation with the data passed in request, returns new
recommendation's id */
router.post('/add', async (req, res) => {
    try{
        // Parse and validate data from request
        const{username, title, category, rating, notes} = req.body;
        if(!username || !title || !category || !rating || !notes){
            return res.status(400).json({error: "Missing data"});
        }

        const db = req.db;
        const recsCollection = db.collection('recommendations')

        // Check for rec with same title and category in database
        const existingRec = await recsCollection.findOne({username, title, category})

        // Check if existingRec title and categroy match
        if(existingRec){
            return res.status(400).json({error: "This user already has a recommendation for this title and category already"})
        }

        // Add result
        const result = await recsCollection.insertOne({
            username, // Uses username instead of userid because usernames are immutable
            title,
            category,
            rating,
            notes
        })

        res.status(200).json({message: "Successfully added recommendation!", id: result.insertedId})
    }

    // Handle errors
    catch(err){
        console.error("ERROR ADDING RECOMMENDATION: ", err);
        res.status(500).json({error: "Server error"});
    }
});

/* Edit recommendation
Pre: Request must contain recommendation id as a string and may
contain one or more of title, category, rating, and notes as strings
Post: Updates the fields passed in request, returns updated recommendation json object */
router.patch('/edit', async (req, res) => {
    try{
        // Parse and validate data from request
        const{id,  
              title, 
              category, 
              rating, 
              notes} = req.body;

        // Check id
        if(!id){
            return res.status(400).json({error: "Missing recommendation id"});
        }

        if(!ObjectId.isValid(id)){
            return res.status(400).json({error: "Invalid recommendation id"});
        }

        // Valid optional fields
        /*if(category !== undefined && 
            (category === "movie"
            || category === "tv"
            || category === "music")
        ){
            return res.status(400).json({error: "Category must be movie, tv, or music"})
        }*/

        if(rating !== undefined && (rating < 1 || rating > 5)){
            return res.status(400).json({error: "Rating must be 1-5"});
        }
  
        // Create db connection
        const db = req.db;
        const recsCollection = db.collection('recommendations');

        // Create objects to update recommendation
        const query = {_id: new ObjectId(id)};

        const updateFields = {};
        if(title !== undefined)
            updateFields.title = title;
        if(category !== undefined)
            updateFields.category = category;
        if(rating !== undefined)
            updateFields.rating = rating;
        if(notes !== undefined)
            updateFields.notes = notes;

        if(Object.keys(updateFields).length === 0) {
            return res.status(400).json({error: "No fields to update"});
        }
        
        // Update recommendation
        const result = await recsCollection.updateOne(
            query, 
            {$set: updateFields});

        if(result.matchedCount === 0)
            return res.status(404).json({error: "Recommendation not found"});

        // Send success response
        const updatedRec = await recsCollection.findOne(query);
        res.status(200).json(updatedRec);
    }
    catch(err)
    {
        console.error("ERROR EDITING RECOMMENDATION: ", err);
        res.status(500).json({error: "Server error"});
    }
});

/* Delete recommendation
Pre: Request contains the recommendation id as a string
Post: The recommendation is deleted from the database */
router.delete('/delete', async (req, res) => {
    try{
        // Get and check rec id
        const id = req.body.id

        if(!id){
            return res.status(400).json({error: "Missing recommendation id"});
        }

        if(!ObjectId.isValid(id)){
            return res.status(400).json({error: "Invalid recommendation id"});
        }

        // Create db connection
        const db = req.db;
        const recsCollection = db.collection('recommendations');

        // Perform deletion
        const result = await recsCollection.deleteOne({_id: new ObjectId(id)});
        if(result.deletedCount === 0){
            return res.status(404).json({error: "Recommendation could not be deleted"});
        }

        res.status(200).json({message: "Successfully deleted recommendation"});
    }
    catch(err){
        console.error("ERROR DELETING RECOMMENDATION: ", err);
        res.status(500).json({error: "Server error"});
    }
});

/* Search for recommendations of a user
Pre: User id as a string
Post: Returns json array of all recommendations. If user has none,
the array is empty */
router.get('/search/:username', async (req, res) => {
    try{
        const username = req.params.username;

        // Create db connection
        const db = req.db;
        const recsCollection = db.collection('recommendations');

        // Perform search
        const results = await recsCollection.find({username}).toArray();

        res.status(200).json(results);
    }
    catch(err){
        console.error("ERROR SEARCHING FOR USER'S RECOMMENDATIONS: ", err);
        res.status(500).json({error: "Server error"});
    }
});

export default router;