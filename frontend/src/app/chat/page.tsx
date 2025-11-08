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
import { Camera, CameraIcon, Divide } from "lucide-react";
import { SocketData } from "@/context/SocketContext";

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
  const { onlineUsers, socket } = SocketData();

  // 🔹 States
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [receiverUser, setReceiverUser] = useState<User | null>(null);
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [showAllUser, setShowAllUser] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [typingTimeOut, setTypingTimeOut] = useState<NodeJS.Timeout | null>(null);

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
      console.error("Error fetching messages:", err.response?.data || err.message);
      if (err.response?.status !== 404) {
        toast.error("Failed to load messages");
      } else {
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
  const handleMessageSend = async (
    e: React.FormEvent<HTMLFormElement>,
    imageFile?: File | null
  ) => {
    e.preventDefault();
    if (!message.trim() && !imageFile) return;
    if (!selectedChatId) {
      toast.error("No chat selected");
      return;
    }

    const token = Cookies.get("token");

    if (typingTimeOut) {
      clearTimeout(typingTimeOut);
      setTypingTimeOut(null);
    }

    // ✅ FIX: Use selectedChatId instead of selectedUserId
    socket?.emit("stopTyping", {
      chatId: selectedChatId,
      userId: loggedInUser?.id,
    });
    setIsTyping(false);

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

      const newMessage = data.data;
      if (!newMessage || !newMessage._id) {
        console.error("Invalid message response:", data);
        toast.error("Failed to send message");
        return;
      }

      console.log("New message sent:", newMessage);

      // ✅ Optimistically add message to UI
      setMessages((prev) => {
        const currentMessages = prev ? [...prev] : [];
        const messageExists = currentMessages.some(
          (msg) => msg._id === newMessage._id
        );
        if (!messageExists) {
          return [...currentMessages, newMessage];
        }
        return currentMessages;
      });

      setMessage("");
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
    if (!selectedChatId || !socket) return;

    // ✅ FIX: Use selectedChatId instead of selectedUserId
    if (value.trim()) {
      socket.emit("typing", {
        chatId: selectedChatId,
        userId: loggedInUser?.id,
      });
    }

    if (typingTimeOut) {
      clearTimeout(typingTimeOut);
    }

    const timeout = setTimeout(() => {
      socket.emit("stopTyping", {
        chatId: selectedChatId,
        userId: loggedInUser?.id,
      });
      setIsTyping(false);
    }, 3000);

    setTypingTimeOut(timeout);
  };

  // ✅ FIX: Listen for typing events with correct chatId
  useEffect(() => {
    if (!socket || !selectedChatId) return;

    const handleUserTyping = (data: { chatId: string; userId: string }) => {
      console.log("received user typing", data);
      if (data.chatId === selectedChatId && data.userId !== loggedInUser?.id) {
        setIsTyping(true);
      }
    };

    const handleUserStoppedTyping = (data: { chatId: string; userId: string }) => {
      console.log("received user stopped typing", data);
      if (data.chatId === selectedChatId && data.userId !== loggedInUser?.id) {
        setIsTyping(false);
      }
    };

    socket.on("userTyping", handleUserTyping);
    socket.on("userStoppedTyping", handleUserStoppedTyping);

    return () => {
      socket?.off("newMessage");
      socket.off("userTyping", handleUserTyping);
      socket.off("userStoppedTyping", handleUserStoppedTyping);
    };
  }, [socket, selectedChatId, loggedInUser?.id]);

  // ✅ NEW: Listen for incoming messages in real-time
  useEffect(() => {
    if (!socket || !selectedChatId) return;

    const handleNewMessage = (newMessage: Message) => {
      console.log("📩 Received new message via socket:", newMessage);
      
      // Only add message if it belongs to current chat
      if (newMessage.chatId === selectedChatId) {
        setMessages((prev) => {
          const currentMessages = prev ? [...prev] : [];
          // Avoid duplicates
          const messageExists = currentMessages.some(
            (msg) => msg._id === newMessage._id
          );
          if (!messageExists) {
            return [...currentMessages, newMessage];
          }
          return currentMessages;
        });
      }
      
      // Update sidebar for all incoming messages
      fetchChats();
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, selectedChatId]);


   // ✅ Listen for seen event from backend
  useEffect(() => {
    if (!socket) return;

    const handleMessagesSeen = ({
      chatId,
      messageIds,
      seenBy,
    }: {
      chatId: string;
      messageIds: string[];
      seenBy: string;
    }) => {
      if (chatId === selectedChatId) {
        setMessages((prev) =>
          prev.map((msg) =>
            messageIds.includes(msg._id)
              ? { ...msg, seen: true, seenAt: new Date().toISOString() }
              : msg
          )
        );
      }
    };

    socket.on("messagesSeen", handleMessagesSeen);

    return () => {
      socket.off("messagesSeen", handleMessagesSeen);
    };
  }, [socket, selectedChatId]);

  // ✅ FIX: Join chat room when selecting a chat
  useEffect(() => {
    if (selectedChatId && socket) {
      fetchChats();
      setIsTyping(false);
      socket.emit("joinChat", selectedChatId); // Use chatId not userId

      return () => {
        socket.emit("leaveChat", selectedChatId);
        setMessages(null);
      };
    }
  }, [selectedChatId, socket]);

  useEffect(() => {
    return () => {
      if (typingTimeOut) {
        clearTimeout(typingTimeOut);
        setTypingTimeOut(null);
      }
    };
  }, [typingTimeOut]);

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
        onlineUsers={onlineUsers}
      />
      <div className="flex-1 flex flex-col p-4 backdrop-blur-xl bg-white/5 border-white/10 sm:ml-80 overflow-hidden">
        <ChatHeader
          setSidebarOpen={setSidebarOpen}
          user={selectedChatId ? receiverUser : null}
          isTyping={isTyping}
          onlineUsers={onlineUsers}
        />
        <ChatMessages
          selectedUser={selectedUserId}
          messages={messages}
          loggedInUser={loggedInUser}
        />
        <MessageInput
          handleMessageSend={handleMessageSend}
          setMessage={handleTyping}
          selectedUser={selectedUserId}
          message={message}
          chatId={selectedChatId}
          socket={socket}
        />
      </div>
    </div> 
  ) : <div>
    <div className="flex items-center justify-center flex-1">
          <p>Select a chat to start messaging</p>
        </div>
  </div>;
};

export default ChatApp;