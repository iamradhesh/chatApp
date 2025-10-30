"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import axios from "axios";

// Service endpoints configuration
export const user_service = "http://localhost:5000";
export const chat_service = "http://localhost:5002";

/**
 * User interface representing the authenticated user data
 */
export interface User {
  /** Unique identifier for the user */
  _id: string;
  /** User's display name */
  name: string;
  /** User's email address */
  email: string;
  /** User's online status */
  isOnline: boolean;
}

/**
 * Chat interface representing a chat conversation
 */
export interface Chat {
  /** Unique identifier for the chat */
  _id: string;
  /** Array of user IDs participating in the chat */
  users: string[];
  /** The most recent message in the chat */
  latestMessage: {
    /** Message content */
    text: string;
    /** ID of the message sender */
    sender: string;
  };
  /** Chat creation timestamp */
  createdAt: string;
  /** Chat last update timestamp */
  updatedAt: string;
  /** Optional count of unseen messages */
  unseenCount?: number;
}

/**
 * Extended chat interface with populated user data
 */
export interface Chats {
  /** Unique identifier */
  _id: string;
  /** Array of user objects with full user data */
  user: User[];
  /** Chat object containing conversation details */
  chat: Chat;
}

/**
 * Type definition for the App Context
 * Provides centralized state management for user authentication, chats, and users
 */
interface AppContextType {
  /** Current authenticated user or null if not authenticated */
  user: User | null;
  /** Loading state indicator for async operations */
  loading: boolean;
  /** Authentication status */
  isAuth: boolean;
  /** Array of chat conversations with populated user data */
  chats: Chats[] | null;
  /** Array of all users in the system */
  users: User[] | null;
  /** Function to update user state */
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  /** Function to update authentication status */
  setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
  /** Function to update chats array */
  setChats: React.Dispatch<React.SetStateAction<Chats[] | null>>;
  /** Function to update users array */
  setUsers: React.Dispatch<React.SetStateAction<User[] | null>>;
  /** Function to logout user and clear authentication data */
  logoutUser: () => Promise<void>;
  /** Function to fetch all chat conversations for the authenticated user */
  fetchChats: () => Promise<void>;
  /** Function to fetch all users in the system */
  fetchUsers: () => Promise<void>;
  /** Function to refresh user data from the server */
  refreshUserData: () => Promise<void>;
}

// Create the App Context with undefined as initial value
const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * Props interface for the AppProvider component
 */
interface AppProviderProps {
  /** Child components to be wrapped by the provider */
  children: ReactNode;
}

/**
 * AppProvider component that manages global application state
 * 
 * This provider component encapsulates all authentication and data management logic
 * for the application. It handles:
 * - User authentication state management
 * - Automatic token validation and user data fetching
 * - Chat and user data management
 * - Logout functionality
 * 
 * @param children - React components to be wrapped by this provider
 * @returns JSX element providing app context to children
 */
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // State for storing current user data
  const [user, setUser] = useState<User | null>(null);
  // State for tracking authentication status
  const [isAuth, setIsAuth] = useState<boolean>(false);
  // 🔧 FIX: Start with loading=true to prevent premature redirects
  const [loading, setLoading] = useState<boolean>(true);
  // State for storing chat conversations
  const [chats, setChats] = useState<Chats[] | null>(null);
  // State for storing all users
  const [users, setUsers] = useState<User[] | null>(null);

  /**
   * Fetches user data from the authentication service
   * 
   * This function validates the JWT token stored in cookies and retrieves
   * the current user's information from the server. If the token is invalid
   * or missing, it sets the authentication status to false.
   * 
   * @throws Will log error to console if API request fails
   */
  const fetchUserData = async (): Promise<void> => {
    try {
      // Get JWT token from cookies
      const token = Cookies.get("token");
      if (!token) {
        setIsAuth(false);
        setUser(null);
        return;
      }

      // 🔧 FIX: Removed setLoading(true) here since we start with loading=true
      
      // Make API request to get user data using axios for consistency
      const response = await axios.get(`${user_service}/api/v1/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Update state with user data and authentication status
      setUser(response.data.user);
      setIsAuth(true);
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Clear authentication state on error
      setIsAuth(false);
      setUser(null);
      // Remove invalid token
      Cookies.remove("token");
    } finally {
      // 🔧 FIX: Always set loading to false when auth check is complete
      setLoading(false);
    }
  };

  /**
   * Logs out the current user
   * 
   * This function performs a complete logout by:
   * - Removing the JWT token from cookies
   * - Clearing user state
   * - Setting authentication status to false
   * - Clearing chats and users data
   * - Showing success message
   */
  const logoutUser = async (): Promise<void> => {
    try {
      // Remove token from cookies
      Cookies.remove("token");
      
      // Clear all user-related state
      setUser(null);
      setIsAuth(false);
      setChats(null);
      setUsers(null);
      
      // Show success message
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Error during logout:", error);
      toast.error("Error during logout");
    }
  };

  /**
   * Fetches all chat conversations for the authenticated user
   * 
   * This function retrieves all chat conversations that the current user
   * is participating in. It requires a valid authentication token.
   * 
   * @throws Will log error to console if API request fails
   */
  const fetchChats = async (): Promise<void> => {
    try {
      const token = Cookies.get("token");
      if (!token) {
        setIsAuth(false);
        return;
      }

      const { data } = await axios.get(`${chat_service}/api/v1/chat/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setChats(data.chats);
    } catch (error) {
      console.error("Error fetching chats:", error);
      // Don't show toast for this error as it might be called frequently
      setChats(null);
    }
  };

  /**
   * Fetches all users in the system
   * 
   * This function retrieves a list of all users, typically used for
   * creating new chats or displaying user directories. Requires valid
   * authentication token.
   * 
   * @throws Will log error to console if API request fails
   */
  const fetchUsers = async (): Promise<void> => {
    try {
      const token = Cookies.get("token");
      if (!token) {
        setIsAuth(false);
        return;
      }

      const { data } = await axios.get(`${user_service}/api/v1/user/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers(data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers(null);
    }
  };

  /**
   * Public method to refresh user data
   * Wrapper around fetchUserData for external use
   */
  const refreshUserData = fetchUserData;

  // Effect hook to fetch initial data on component mount
  useEffect(() => {
    fetchUserData();
    // 🔧 FIX: Don't fetch users here, do it after auth is confirmed
  }, []);

  // Effect hook to fetch chats and users when user becomes authenticated
  useEffect(() => {
    if (isAuth) {
      fetchChats();
      fetchUsers(); // 🔧 FIX: Moved here from mount effect
    } else {
      // Clear chats when user is not authenticated
      setChats(null);
    }
  }, [isAuth]);

  // Context value object containing all state and functions
  const contextValue: AppContextType = {
    user,
    loading,
    isAuth,
    chats,
    users,
    setUser,
    setIsAuth,
    setChats,
    setUsers,
    logoutUser,
    fetchChats,
    fetchUsers,
    refreshUserData,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

/**
 * Custom hook to access the App Context
 * 
 * This hook provides type-safe access to the application's global state
 * and methods. It must be used within components that are wrapped by
 * the AppProvider.
 * 
 * @throws Error if used outside of AppProvider
 * @returns AppContextType object containing user state and methods
 */
export const useAppData = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppData must be used within an AppProvider");
  }
  return context;
};