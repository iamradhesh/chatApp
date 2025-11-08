/**
 * -------------------------------------------------------------
 * 🧠 Socket.IO Chat Server Documentation
 * -------------------------------------------------------------
 * This server enables real-time communication for a chat app.
 * Features include:
 *  - Tracking online users
 *  - Typing indicators
 *  - Joining/leaving chat rooms
 *  - Connection and disconnection handling
 * -------------------------------------------------------------
 */

import { Server, Socket } from "socket.io";
import http from "http";
import express from "express";

/**
 * Create an Express app and HTTP server to integrate with Socket.IO
 */
const app = express();
const server = http.createServer(app);

/**
 * Initialize Socket.IO with CORS configuration
 */
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

/**
 * A map to store userId -> socketId for tracking online users
 */
const userSocketMap: Record<string, string> = {};

/**
 * A map to store reciverId -> socketId
 */
export const getRecieverSocketId = (recieverId: string): string | undefined => {
  return userSocketMap[recieverId];
};
/**
 * When a client connects to the server
 */
io.on("connection", (socket: Socket) => {
  console.log(`User connected 🚀: ${socket.id}`);

  /**
   * Extract userId from handshake query parameters
   */
  const userId = socket.handshake.query.userId as string | undefined;

  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;
    console.log(`User ${userId} mapped to socket ${socket.id}`);
  }

  /**
   * Broadcast updated list of online users to all clients
   */
  io.emit("getOnlineUser", Object.keys(userSocketMap));

  /**
   * Each user also joins a personal room (their userId)
   */
  if (userId) {
    socket.join(userId);
  }

  /**
   * -------------------------------------------------------------
   * ✍️ Typing Events
   * -------------------------------------------------------------
   * These events notify others when a user starts or stops typing
   */

  socket.on("typing", (data) => {
    console.log(`User ${data.userId} is typing... in chat ${data.chatId}`);

    socket.to(data.chatId).emit("userTyping", {
      chatId: data.chatId,
      userId: data.userId,
    });
  });

  socket.on("stopTyping", (data) => {
    console.log(`User ${data.userId} stopped typing in chat ${data.chatId}`);

    socket.to(data.chatId).emit("userStoppedTyping", {
      chatId: data.chatId,
      userId: data.userId,
    });
  });

  /**
   * -------------------------------------------------------------
   * 💬 Chat Room Management
   * -------------------------------------------------------------
   * Allows users to join or leave specific chat rooms
   */

  socket.on("joinChat", (chatId: string) => {
    socket.join(chatId);
    console.log(`User ${userId} joined chat room: ${chatId}`);
  });

  socket.on("leaveChat", (chatId: string) => {
    socket.leave(chatId);
    console.log(`User ${userId} left chat room: ${chatId}`);
  });

  /**
   * -------------------------------------------------------------
   * 🔌 Disconnect Handling
   * -------------------------------------------------------------
   * Removes user from the map and updates online user list
   */

  socket.on("disconnect", () => {
    console.log(`User disconnected 🔥: ${socket.id}`);

    if (userId) {
      delete userSocketMap[userId];
      console.log(`User with ${userId} removed from online users list`);
      io.emit("getOnlineUser", Object.keys(userSocketMap));
    }
  });

  /**
   * -------------------------------------------------------------
   * ⚠️ Error Handling
   * -------------------------------------------------------------
   */
  socket.on("connect_error", (error) => console.error("Socket error:", error));
});

/**
 * Export app, server, and io for external use
 */
export { app, server, io };