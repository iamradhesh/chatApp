"use client";
import React, { useEffect, useState } from "react";
import { chat_service, useAppData, User } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import ChatSidebar from "@/components/ChatSidebar";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import axios from "axios";
import ChatHeader from "@/components/ChatHeader";
import ChatMessages from "@/components/ChatMessages";
import MessageInput from "@/components/MessageInput";
import { Camera, CameraIcon } from "lucide-react";

export interface Message {
  _id: string;
  text?: string;
  chatId: string;
  sender: string;
  image?: {
    url: string;
    publicId: string;
  };
  messageType: "text" | "image";
  seen: boolean;
  seenAt?: string;
  createdAt: string;
}

const ChatApp: React.FC = () => {
  const {
    loading,
    isAuth,
    logoutUser,
    chats,
    user: loggedInUser,
    users,
    fetchChats,
  } = useAppData();

  const router = useRouter();

  // 🔹 States
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [receiverUser, setReceiverUser] = useState<User | null>(null);
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [showAllUser, setShowAllUser] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  // 🔹 Redirect if not authenticated
  useEffect(() => {
    if (!isAuth && !loading) router.push("/login");
  }, [loading, isAuth, router]);

  // 🔹 Fetch chats when user logs in
  useEffect(() => {
    if (isAuth) fetchChats();
  }, [isAuth]);

  // 🔹 Logout
  const handleLogout = () => {
    logoutUser();
    router.push("/login");
  };

  // 🔹 Create new chat
  async function createChat(u: User) {
    try {
      const token = Cookies.get("token");
      const { data } = await axios.post(
        `${chat_service}/api/v1/chat/new`,
        { otherUserId: u._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const chatId = data.chat?._id || data.chatId;
      if (chatId) {
        setSelectedChatId(chatId);
        setSelectedUserId(u._id);
        setReceiverUser(u);
        setShowAllUser(false);
        await fetchChats();

        // Fetch messages for the new/existing chat
        fetchMessagesForChat(chatId);
      } else {
        toast.error("Chat ID not found in response");
      }
    } catch (err: any) {
      console.error("Error creating chat:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Failed to create chat.");
    }
  }

  // 🔹 Fetch messages for a specific chat
  const fetchMessagesForChat = async (chatId: string) => {
    if (!chatId) {
      console.warn("No chat ID provided to fetch messages");
      return;
    }

    try {
      const token = Cookies.get("token");
      const { data } = await axios.get(
        `${chat_service}/api/v1/message/${chatId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(data.messages || []);
    } catch (err: any) {
      console.error(
        "Error fetching messages:",
        err.response?.data || err.message
      );

      // Only show error if it's not a "Chat not found" error
      if (err.response?.status !== 404) {
        toast.error("Failed to load messages");
      } else {
        // If chat not found, initialize with empty messages
        setMessages([]);
      }
    }
  };

  // 🔹 When user selects a chat from sidebar
  const handleChatSelect = (chatId: string, user: User) => {
    setSelectedChatId(chatId);
    setSelectedUserId(user._id);
    setReceiverUser(user);
    setSidebarOpen(false);

    // Fetch messages if chatId exists
    if (chatId) {
      fetchMessagesForChat(chatId);
    }
  };

  // 🔹 Fetch messages when chat selected
  useEffect(() => {
    if (selectedChatId) {
      fetchMessagesForChat(selectedChatId);
    }
  }, [selectedChatId]);

  
 // 🔹 Send message
const handleMessageSend = async (e: React.FormEvent<HTMLFormElement>, imageFile?: File | null) => {
  e.preventDefault();
  if (!message.trim() && !imageFile) return;
  if (!selectedChatId) {
    toast.error("No chat selected");
    return;
  }

  const token = Cookies.get("token");
  try {
    const formData = new FormData();
    formData.append("chatId", selectedChatId);
    if (message.trim()) formData.append("text", message);
    if (imageFile) formData.append("image", imageFile);

    const { data } = await axios.post(
      `${chat_service}/api/v1/message`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    
    // ✅ CORRECTED: Based on your API structure, the message is in data.data
    // Your API returns: { message: "success message", data: { actual message object } }
    const newMessage = data.data;
    
    if (!newMessage || !newMessage._id) {
      console.error("Invalid message response:", data);
      toast.error("Failed to send message");
      return;
    }
    
    console.log("New message sent:", newMessage); // Debug log
    
    // ✅ Optimistically add message to UI immediately
    setMessages((prev) => {
      const currentMessages = prev ? [...prev] : [];
      
      // Check if message already exists (avoid duplicates)
      const messageExists = currentMessages.some(
        (msg) => msg._id === newMessage._id
      );
      
      if (!messageExists) {
        return [...currentMessages, newMessage];
      }
      return currentMessages;
    });
    
    // Clear input
    setMessage("");

    // ✅ Update sidebar to show latest message
    await fetchChats();
    
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("Send message error:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Message send failed");
    } else {
      console.error("Send message error:", error);
      toast.error("Message send failed");
    }
  }
};

  const handleTyping = (value: string) => {
    setMessage(value);
    if (!selectedChatId) return;
    // Socket events can be added here later
  };

  // 🔹 Loader
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  // 🔹 Main UI
  return isAuth ? (
    <div className="ChatParentClass h-screen bg-gray-900 text-white flex">
      <ChatSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        showAllUser={showAllUser}
        setShowAllUser={setShowAllUser}
        users={users}
        loggedInUser={loggedInUser}
        chats={chats}
        selectedUser={selectedUserId}
        setSelectedUser={setSelectedUserId}
        handleLogout={handleLogout}
        createChat={createChat}
        onChatSelect={handleChatSelect}
      />

      <div className="flex-1 flex flex-col p-4 backdrop-blur-xl bg-white/5 border-white/10 sm:ml-80 overflow-hidden">
        <ChatHeader
          setSidebarOpen={setSidebarOpen}
          user={selectedChatId ? receiverUser : null}
          isTyping={isTyping}
        />

        <ChatMessages
          selectedUser={selectedUserId}
          messages={messages}
          loggedInUser={loggedInUser}
        />
        <MessageInput handleMessageSend={handleMessageSend} setMessage={handleTyping} selectedUser = {selectedUserId} message = {message}  />
      </div>
    </div>
  ) : null;
};

export default ChatApp;