"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import Cookies from "js-cookie";

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
 */
interface AppContextType {
  /** Current authenticated user or null if not authenticated */
  user: User | null;
  /** Loading state indicator */
  loading: boolean;
  /** Authentication status */
  isAuth: boolean;
  /** Function to update user state */
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  /** Function to update authentication status */
  setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
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
 * Provides user authentication state and user data throughout the app
 * 
 * @param children - React components to be wrapped by this provider
 * @returns JSX element providing app context to children
 */
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // State for storing current user data
  const [user, setUser] = useState<User | null>(null);
  // State for tracking authentication status
  const [isAuth, setIsAuth] = useState<boolean>(false);
  // State for tracking loading state during API calls
  const [loading, setLoading] = useState<boolean>(false);

  /**
   * Fetches user data from the authentication service
   * Uses JWT token from cookies to authenticate the request
   * Updates user state and authentication status based on response
   */
  async function fetchUserData() {
    try {
      // Get JWT token from cookies
      const token = Cookies.get("token");
      if (!token) {
        setIsAuth(false);
        return;
      }

      setLoading(true);
      
      // Make API request to get user data
      const response = await fetch(`${user_service}/api/v1/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const data = await response.json();

      // Update state with user data and authentication status
      setUser(data);
      setIsAuth(true);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  }

  // Effect hook to fetch user data on component mount
  useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        isAuth,
        setUser,
        setIsAuth,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

/**
 * Custom hook to access the App Context
 * Provides type-safe access to user authentication state and methods
 * 
 * @throws Error if used outside of AppProvider
 * @returns AppContextType object containing user state and methods
 * 
 * @example
 * ```tsx
 * const { user, isAuth, loading } = useAppData();
 * 
 * if (loading) return <div>Loading...</div>;
 * if (!isAuth) return <div>Please log in</div>;
 * return <div>Welcome, {user?.name}!</div>;
 * ```
 */
export const useAppData = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppData must be used within an AppProvider");
  }
  return context;
};