import express from 'express'; //to create route handlers for this api file
import { ObjectId } from 'mongodb'; //for mongodb _id values

const router = express.Router();//create router object so file can define own routes

//pre: request must contail: senderId, receiverId, title, category, rating, notes
//Post: creates a sentRecommendation, message, adds recommendation to receivers recommendation list
//req: request from frontend, res: response back to frontend
router.post('/send', async(req, res) => {
    try{
        //extract data out of incoming request body from the frontend
        const{ senderId, receiverId, title, category, rating, notes } = req.body;

        //check that all required fields were actually sent
        if( !senderId || !receiverId || !title || !category || rating === undefined || notes === undefined)
        {
            //send a 400 status because client sent incomplete input
            return res.status(400).json({ error: 'Missing data'});
        }

        //make sure senderId and receiverId are valid mongodb ObjectId strings to prevent crashes
        if(!ObjectId.isValid(senderId) || !ObjectId.isValid(receiverId))
        {
            //return a 400 status because ids are not valid
            return res.status(400).json({ error: 'Invalid sender or receiver id' });
        }

        //prevent user from sending rec to themselves
        if(senderId === receiverId)
        {
            return res.status(400).json({error: 'User cannot send a recommendation to themselves'});
        }

        //make sure rating stays in 1-5 range
        if(rating < 1 || rating > 5)
        {
            // Return a 400 because the input is invalid
            return res.status(400).json({ error: 'Rating must be 1-5' });
        }

        //get database connection from main server
        const db = req.db;

        //get users collection
        const usersCollection = db.collection('users');
        // Get the recommendations collection
        const recsCollection = db.collection('recommendations');
        // Get the messages collection
        const messagesCollection = db.collection('messages');
        // Get the sentRecommendation collection
        const sentRecsCollection = db.collection('sentRecommendation');

        //Find the sender and receiver user document using senderId and receiverId
        //_id: new ObjectId(senderId): query filter, only returns a doc where _id = senderId
        //front end just sends a string, convert string into an object of ObjectId
        const senderUser = await usersCollection.findOne({_id: new ObjectId(senderId)});
        const receiverUser = await usersCollection.findOne({_id: new ObjectId(receiverId)});

        if(!senderUser)//if sender does not exist
        {
            // Return a 404 because the sender user could not be found
            return res.status(404).json({ error: 'Sender not found' });
        }
        if(!receiverUser)//if receiver user does not exist
        {
            return res.status(404).json({ error: 'Receiver not found' });
        }

        //check if same receiver already sent this same title/category
        //to avoid duplicate sentRecommendations
        const existingSentRec = await sentRecsCollection.findOne({
            senderId: new ObjectId(senderId), 
            receiverId: new ObjectId(receiverId), 
            title, category
        })

        //if duplicate sentRecommendation exists stop and send error
        if(existingSentRec)
        {
            // Return a 400 because this send action already happened
            return res.status(400).json({error: 'This recommendation has already been sent to this user'});
        }


        //insert a new document into sentRecommendation
        const sentRecResult = await sentRecsCollection.insertOne({
            //store senderId as ObjectId
            senderId: new ObjectId(senderId),
            //store receiverId as ObjectId
            receiverId: new ObjectId(receiverId),
            //store title, category, rating, notes
            title, category, rating, notes
        });

        //create a formatted message string
        //insert a message string into messages collection
        //allows user to see the recommendation in chat module
        const messageText = `${senderUser.username} sent you a recommendation: ${title}`;
        const messageResult = await messagesCollection.insertOne({
            // Store the sender user's ObjectId
            senderId: new ObjectId(senderId),
            // Store the receiver user's ObjectId
            receiverId: new ObjectId(receiverId),
            //store message string
            messageText,
            //store when message collection entry was created
            createdAt: new Date()
        });

        //check if receiver already has this recommendation in their own list
        //check this users recs by title and category
        const receiverExistingRec = await recsCollection.findOne({
            //look for recs that belong to receiver
            username: receiverUser.username,
            title, category
        });
        //if its not in receivers list
        if(!receiverExistingRec)
        {
            //insert the recommendation into their list
            //store: username, title, category, rating, notes
            await recsCollection.insertOne({
                username: receiverUser.username, 
                title, category, rating, notes
            });
        }

        //return success response to frontend
        //insertId: is returned by mongoDB after insertOne() runs
        return res.status(200).json({
            message: 'Recommendation sent successfully',
            // ID of the new sentRecommendation document
            sentRecommendationId: sentRecResult.insertedId,
            // ID of the new message document
            messageId: messageResult.insertedId
        });
    }//try

    catch (err)
    {
        //log full error on server for debugging
        console.error('ERROR SENDING RECOMMENDATION: ', err);
        // Return a generic 500 error so the client knows the server failed
        return res.status(500).json({ error: 'Server error' });
    }



});//end router.post

//export this router so main server file can import and use it
export default router;