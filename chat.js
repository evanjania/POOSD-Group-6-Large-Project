import express from 'express';
import {ObjectId} from 'mongodb';
const router = express.Router();

//Load history
router.get("/:currentUserId/:friendId", async (req, res, next) => {
    try {
        const { currentUserId, friendId } = req.params;
        const db = req.db;

        const userA = new ObjectId(currentUserId);
        const userB = new ObjectId(friendId);

        const chatHistory = await db.collection("messages").find({
            $or: [
                { senderId: userA, receiverId: userB },
                { senderId: userB, receiverId: userA }
            ]
        })
        .sort({ createdAt: 1 }) //display oldest message first
        .toArray();

        const formattedHistory = chatHistory.map(msg => ({
            ...msg,
            id: msg._id,
        }));

        res.status(200).json(formattedHistory);
    } catch (err) {
        console.error("FETCH MSG ERROR:", err);
        res.status(500).json({ error: "Could not load messages" });
    }
});

router.post("/mark-read", async (req, res) => {
    try {
        const { currentUserId, friendId } = req.body;
        const db = req.db;

        await db.collection("messages").updateMany(
            { 
                senderId: new ObjectId(friendId), 
                receiverId: new ObjectId(currentUserId),
                isRead: false 
            },
            { $set: { isRead: true } }
        );

        res.status(200).json({ message: "Messages marked as read" });
    } catch (err) {
        res.status(500).json({ error: "Failed to update read status" });
    }
});

export default router;