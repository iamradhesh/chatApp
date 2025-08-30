// This is Chat Controller

import TryCatch from "../config/TryCatch.js";
import type { AuthenticatedRequest } from "../middlewares/isAuth.js";
import Chat from "../models/Chat.js";

// Create a new chat
export const createNewChat = TryCatch(async(req:AuthenticatedRequest,res)=>{
    // Logic for creating a new chat
    const userId = req.user?.id;
    console.log("userID:", userId);
    const {otherUserId} = req.body;
    if(!otherUserId)
    {
       return res.status(400).json({message:"otherUserId is required"});
    }

    if (!userId) {
        res.status(401).json({ message: "User not authenticated" });
        return;
    }

    // Continue with chat creation logic

    const existingChat = await Chat.findOne({
        users: { $all: [userId, otherUserId] }
    });

    if (existingChat) {
        return res.status(400).json({ message: "Chat already exists" , chatId: existingChat._id });
    }

    const newChat = await Chat.create({
        users: [userId, otherUserId],
        $size: 2,
    });

    res.status(201).json({ message: "Chat created successfully", chat: newChat });
})

//Fetch all chats for a user
export const fetchChats = TryCatch(async (req: AuthenticatedRequest, res) => {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
    }

    const chats = await Chat.find({
        users: { $in: [userId] }
    });

    res.status(200).json({ chats });
});