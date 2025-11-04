import dotenv from "dotenv";
import axios from "axios";
import TryCatch from "../config/TryCatch.js";
import type { AuthenticatedRequest } from "../middlewares/isAuth.js";
import Chat from "../models/Chat.js";
import { Messages } from "../models/Message.js";

dotenv.config();

// Create a new chat or return existing
export const createNewChat = TryCatch(async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;
  const { otherUserId } = req.body;

  if (!userId) return res.status(401).json({ message: "User not authenticated" });
  if (!otherUserId) return res.status(400).json({ message: "otherUserId is required" });

  // Check existing chat
  const existingChat = await Chat.findOne({ users: { $all: [userId, otherUserId] } });

  if (existingChat) {
    return res.status(200).json({
      message: "Chat already exists",
      chat: existingChat,
      chatId: existingChat._id,
    });
  }

  // Create new chat
  const newChat = await Chat.create({ users: [userId, otherUserId] });

  return res.status(201).json({
    message: "Chat created successfully",
    chat: newChat,
    chatId: newChat._id,
  });
});

// Fetch all chats for a user
export const getAllChats = TryCatch(async (req: AuthenticatedRequest, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res
      .status(401)
      .json({ message: "User not authenticated, User ID is missing" });
  }

  const chats = await Chat.find({ users: userId }).sort({ updatedAt: -1 });
  
  const chatWithUserData = await Promise.all(
    chats.map(async (chat) => {
      const otherUserId = chat.users.find((id) => id.toString() !== userId.toString());

      const unseenCount = await Messages.countDocuments({
        chatId: chat._id,
        seen: false,
        sender: { $ne: userId },
      });

      // ✅ If latestMessage is empty, get it from Messages collection
      let latestMessage = chat.latestMessage;
      
      if (!latestMessage?.text) {
        const lastMsg = await Messages.findOne({ chatId: chat._id })
          .sort({ createdAt: -1 })
          .limit(1);
        
        if (lastMsg) {
          latestMessage = {
            text: lastMsg.image ? "📷 Image" : (lastMsg.text || ""),
            sender: lastMsg.sender,
          };
        }
      }

      try {
        const { data } = await axios.get(
          `${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`,
          { timeout: 3000 }
        );

        return {
          user: data.user,
          chat: {
            ...chat.toObject(),
            latestMessage: latestMessage || null,
            unseenCount,
          },
        };
      } catch (error) {
        console.error(
          `User service error for ${otherUserId}:`,
          (error as Error).message
        );

        return {
          user: { _id: otherUserId, name: "Unknown", avatar: "default.jpg" },
          chat: {
            ...chat.toObject(),
            latestMessage: latestMessage || null,
            unseenCount,
          },
        };
      }
    })
  );

  res.status(200).json({ chats: chatWithUserData });
});

// Send Message
export const sendMessage = TryCatch(async (req: AuthenticatedRequest, res) => {
  const senderId = req.user?.id;
  const imageFile = req.file;

  // Accept chatId and text from either JSON body or form-data
  const chatId = req.body.chatId || (req.body as any).chatId;
  const text = req.body.text || (req.body as any).text;

  if (!senderId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  // Require either text or image
  if (!chatId || (!text && !imageFile)) {
    return res.status(400).json({
      message: "chatId and either text OR image are required",
    });
  }

  // Fetch chat
  const chat = await Chat.findById(chatId);
  if (!chat) {
    return res.status(404).json({ message: "Chat not found" });
  }

  // Check if sender is in chat
  const isUserInChat = chat.users.includes(senderId);
  if (!isUserInChat) {
    return res
      .status(403)
      .json({ message: "User not authorized to send messages in this chat" });
  }

  // Build message data
  const messageData = {
    chatId,
    sender: senderId,
    text: text || undefined,
    image: imageFile
      ? { url: imageFile.path, publicId: imageFile.filename }
      : null,
    messageType: imageFile ? "image" : ("text" as "text" | "image"),
    seen: false,
    seenAt: null as Date | null,
  };

  // Save message
  const message = new Messages(messageData);
  const savedMessage = await message.save();

  // ✅ Update latest message in chat BEFORE sending response
  const latestMessageText = imageFile
    ? "📷 Image"
    : (text || "Message");
  
  await Chat.findByIdAndUpdate(
    chatId,
    {
      latestMessage: {
        text: latestMessageText,
        sender: senderId,
      },
      updatedAt: new Date(),
    },
    { new: true }
  );

  // ✅ Send response AFTER updating chat
  res.status(201).json({
    message: "Message created successfully",
    data: savedMessage,
    senderId,
  });
});

// Get Messages By Chat
export const getMessagesByChat = TryCatch(
  async (req: AuthenticatedRequest, res) => {
    const { chatId } = req.params;
    const userId = req.user?.id;

    if (!chatId) {
      return res.status(400).json({ message: "Chat ID is required" });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    // ✅ Fixed: Compare correctly
    const isUserInChat = chat.users.some(
      (id) => id.toString() === userId.toString()
    );
    
    if (!isUserInChat) {
      return res
        .status(403)
        .json({ message: "User not authorized to access this chat" });
    }

    // Mark messages as seen
    await Messages.updateMany(
      {
        chatId,
        seen: false,
        sender: { $ne: userId },
      },
      {
        seen: true,
        seenAt: new Date(),
      }
    );
    
    const messages = await Messages.find({ chatId }).sort({ createdAt: 1 });

    const otherUserId = chat.users.find((id) => id.toString() !== userId?.toString());

    if (!otherUserId) {
      return res.status(400).json({ message: "Other user not found" });
    }

    try {
      const { data } = await axios.get(
        `${process.env.USER_SERVICE}/api/v1/user/${otherUserId}`,
        { timeout: 3000 }
      );

      if (!data) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(200).json({ messages, user: data });
      
    } catch (error) {
      console.error("Error fetching other user data:", error);
      res.status(500).json({ 
        message: "Internal server error", 
        user: { _id: otherUserId, name: "Unknown" }
      });
    }
  }
);