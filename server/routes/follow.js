import express from 'express';
import {ObjectId} from 'mongodb';
const router = express.Router();

// Search Users
router.get("/users/search", async (req, res, next ) => {
    try {
        const query = req.query.q;
        
        if (!query) {
            return res.status(200).json([]);
        }

        const db = req.db;
        
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
router.post('/request', async (req, res, next) =>{
    try{
        const followerId = req.user.userId;
        const { followingId } = req.body;

        if(!followerId || !followingId)
            return res.status(400).json({error: "Missing user IDs"});

        // Create db connection
        const db = req.db;
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
router.get('/pending/', async (req, res, next) => {
    try {
        const { userId } = req.user.userId;
        const db = req.db;

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
router.post('/approve', async (req, res, next) => {
    try{
        const { requestId } = req.body;
        if (!requestId) {
            return res.status(400).json({ error: "Missing request ID" });
        }

        const db = req.db;
        
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
router.post('/deny', async (req, res, next) => {
    try {
        const { requestId } = req.body;

        if (!requestId) {
            return res.status(400).json({ error: "Missing request ID" });
        }

        const db = req.db;
        
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
router.post('/remove', async (req, res, next) => {
    try {
        const currentUserId = req.user.userId;
        const { friendId } = req.body;

        if (!currentUserId || !friendId) {
            return res.status(400).json({ error: "Missing user IDs" });
        }

        const db = req.db;
        
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
router.get('/friends/', async (req, res,next ) => {
    try {
        const userId = req.user.userId;
        const db = req.db;
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

export default router;