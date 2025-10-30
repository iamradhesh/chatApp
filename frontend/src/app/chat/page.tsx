'use client'
import React, { useEffect } from 'react'
import { useAppData, User } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import ChatSidebar from '@/components/ChatSidebar';

/**
 * Interface representing a chat message
 */
export interface Message {
  /** Unique identifier for the message */
  _id: string;
  /** Text content of the message (optional for image messages) */
  text?: string;
  /** ID of the chat this message belongs to */
  chatId: string;
  /** ID of the user who sent the message */
  sender: string;
  /** Image data if message type is 'image' */
  image?: {
    /** URL of the uploaded image */
    url: string;
    /** Public ID for image management (e.g., Cloudinary) */
    publicId: string;
  };
  /** Type of message content */
  messageType: 'text' | 'image';
  /** Whether the message has been seen by recipients */
  seen: boolean;
  /** Timestamp when the message was seen (optional) */
  seenAt?: string;
  /** Timestamp when the message was created */
  createdAt: string;
}

/**
 * ChatApp Component - Main chat application interface
 * 
 * @component
 * @description This component serves as the main entry point for the chat application.
 * It handles authentication checks and redirects unauthenticated users to the login page.
 * 
 * @features
 * - Authentication guard - redirects to login if not authenticated
 * - Loading state awareness - waits for auth check to complete
 * - Automatic navigation based on authentication status
 * 
 * @example
 * ```tsx
 * // Usage in pages or routing
 * <ChatApp />
 * ```
 * 
 * @returns {JSX.Element} Chat application interface or redirects to login
 */
const ChatApp: React.FC = () => {
  // Get authentication state from global context
  const { loading, isAuth, logoutUser, chats, user: loggedInUser, users, fetchChats, setChats } = useAppData();
  
  // Next.js router for navigation
  const router = useRouter();

  const [selectedUser, setSelectedUser] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string>('');
  const [messages, setMessages] = React.useState<Message[] | null>(null);
  const [sidebarOpen, setSidebarOpen] = React.useState<boolean>(false);
  const [user, setUser] = React.useState<User | null>(null);
  const [showAllUser, setShowAllUser] = React.useState<boolean>(false);
  const [isTyping, setIsTyping] = React.useState<boolean>(false);
  const [typingTimeOut, setTypingTimeOut] = React.useState<NodeJS.Timeout | null>(null);

  console.log("isAuth", isAuth);
  console.log("users from context:", users); // ✅ Add this debug log
  
  /**
   * Effect to handle authentication-based navigation
   * Redirects unauthenticated users to login page
   * Only runs after loading is complete to avoid premature redirects
   */
  useEffect(() => {
    if (!isAuth && !loading) {
      router.push('/login');
    }
  }, [loading, isAuth, router]);

  // Show loading state while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  // Don't render content if not authenticated (will redirect)
  if (!isAuth) {
    return null;
  }

  const handleLogout = () => {
    logoutUser();
    router.push('/login');
  }

  return (
    <div className='min-h-screen bg-gray-900 text-white flex items-center justify-center relative overflow-hidden'>
      <ChatSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        showAllUser={showAllUser}
        setShowAllUser={setShowAllUser}
        users={users}  // ✅ FIXED: Changed from user={users} to users={users}
        loggedInUser={loggedInUser}
        chats={chats}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        handleLogout={handleLogout}
      />
    </div>
  );
};

export default ChatApp;