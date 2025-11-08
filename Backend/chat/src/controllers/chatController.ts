import dotenv from "dotenv";
import axios from "axios";
import TryCatch from "../config/TryCatch.js";
import type { AuthenticatedRequest } from "../middlewares/isAuth.js";
import Chat from "../models/Chat.js";
import { Messages } from "../models/Message.js";
import { getRecieverSocketId, io } from "../config/socket.js"; // ✅ Import socket.io instance

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

// ✅ Send Message with Socket.IO Emission
export const sendMessage = TryCatch(async (req: AuthenticatedRequest, res) => {
  const senderId = req.user?.id;
  const imageFile = req.file;

  const chatId = req.body.chatId;
  const text = req.body.text;

  if (!senderId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  if (!chatId || (!text && !imageFile)) {
    return res.status(400).json({
      message: "chatId and either text OR image are required",
    });
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    return res.status(404).json({ message: "Chat not found" });
  }

  const isUserInChat = chat.users.some(
    (userId) => userId.toString() === senderId.toString()
  );
  if (!isUserInChat) {
    return res
      .status(403)
      .json({ message: "User not authorized to send messages in this chat" });
  }

  const otherUserId = chat.users.find(
    (id) => id.toString() !== senderId.toString()
  );

  let isReceiverInChatRoom = false;

  if (otherUserId) {
    const receiverSocketId = getRecieverSocketId(otherUserId.toString());
    if (receiverSocketId) {
      const receiverSocket = io.sockets.sockets.get(receiverSocketId);
      // ✅ check if receiver has joined this chat room
      if (receiverSocket && receiverSocket.rooms.has(chatId)) {
        isReceiverInChatRoom = true;
      }
    }
  }

  // ✅ Build message data
  const messageData = {
    chatId,
    sender: senderId,
    text: text || undefined,
    image: imageFile
      ? { url: imageFile.path, publicId: imageFile.filename }
      : null,
    messageType: imageFile ? "image" : "text",
    seen: isReceiverInChatRoom, // ✅ mark as seen if receiver is in chat room
    seenAt: isReceiverInChatRoom ? new Date() : null,
  };

  const message = new Messages(messageData);
  const savedMessage = await message.save();

  // ✅ Update latest message
  const latestMessageText = imageFile ? "📷 Image" : text || "Message";
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

  // ✅ Emit message to chat room
  io.to(chatId).emit("newMessage", savedMessage);
  console.log(`📤 Message emitted to chat room: ${chatId}`);

  // ✅ Notify receiver personally if online
  if (otherUserId) {
    const receiverSocketId = getRecieverSocketId(otherUserId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", savedMessage);
      console.log(`📤 Message emitted to receiver: ${otherUserId}`);
    }
  }

  return res.status(201).json({
    message: "Message created successfully",
    data: savedMessage,
    senderId,
    isReceiverInChatRoom,
  });
});

// Get Messages By Chat
export const getMessagesByChat = TryCatch(async (req: AuthenticatedRequest, res) => {
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

  const isUserInChat = chat.users.some(
    (id) => id.toString() === userId.toString()
  );

  if (!isUserInChat) {
    return res
      .status(403)
      .json({ message: "User not authorized to access this chat" });
  }

  // ✅ Step 1: Get unseen messages first
  const unseenMessages = await Messages.find({
    chatId,
    seen: false,
    sender: { $ne: userId },
  });

  // ✅ Step 2: Mark them as seen
  if (unseenMessages.length > 0) {
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

    // ✅ Step 3: Emit event to the sender that messages are seen
    const otherUserId = chat.users.find((id) => id.toString() !== userId.toString());
    if (otherUserId) {
      const senderSocketId = getRecieverSocketId(otherUserId.toString());
      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesSeen", {
          chatId,
          seenBy: userId,
          messageIds: unseenMessages.map((m) => m._id),
        });
      }
    }
  }

  // ✅ Step 4: Fetch all messages for display
  const messages = await Messages.find({ chatId }).sort({ createdAt: 1 });

  const otherUserId = chat.users.find(
    (id) => id.toString() !== userId?.toString()
  );

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
      user: { _id: otherUserId, name: "Unknown" },
    });
  }
});
