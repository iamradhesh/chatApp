"use client";

import { createContext, ProviderProps, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { chat_service, useAppData } from "./AppContext";

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: string[];

}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  onlineUsers: [],

});


interface SocketProviderProps {
  children: React.ReactNode;
}


export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user } = useAppData();
  const [onlineUsers,setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    // console.log("SocketContext user check:", user);
    if (!user?.id) {
      // console.log("Socket connection skipped: No user ID.");
      return;
    }
    console.log("Attempting socket connection...");

    const newSocket = io(chat_service, {
      transports: ["websocket"], // enforce websocket (no polling fallback)
      query:{
        userId:user?.id
      }
    });

    newSocket.on("connect", () => console.log("🟢 Socket connected:", newSocket.id));
    newSocket.on("disconnect", () => console.log("🔴 Socket disconnected:", newSocket.id));
    newSocket.on("connect_error", (err) => console.error("🔴 Socket error:", err));

    setSocket(newSocket);

    newSocket.on("getOnlineUser",(users:string[])=>{
       setOnlineUsers(users);
    })
    return () => {
      newSocket.disconnect();
    };
  }, [user?.id]);


  return (
    <SocketContext.Provider value={{ socket,onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}

export const SocketData = () => useContext(SocketContext);