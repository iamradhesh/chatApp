import { User } from "@/context/AppContext";
import {
  CornerDownRight,
  MessageCircle,
  MessageCircleIcon,
  Plus,
  Search,
  UserCircle,
  X,
  LogOut,
} from "lucide-react";
import React from "react";
import Link from "next/link";

interface ChatSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  showAllUser?: boolean;
  setShowAllUser?: (show: boolean | ((prev: boolean) => boolean)) => void;
  users?: User[] | null;
  loggedInUser?: User | null;
  chats?: any[] | null;
  selectedUser?: string | null;
  setSelectedUser?: (userId: string | null) => void;
  handleLogout?: () => void;
  createChat?: (u: User) => Promise<void>;
  onChatSelect: (chatId: string, user: User) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  showAllUser = false,
  setShowAllUser,
  users,
  loggedInUser,
  chats,
  selectedUser,
  setSelectedUser,
  handleLogout,
  createChat,
  onChatSelect,
}) => {
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [chatList, setChatList] = React.useState(chats || []);

  React.useEffect(() => {
    if (chats) setChatList(chats);
  }, [chats]);

  users?.forEach((user) => (user.isOnline = true));

  const handleToggle = () => {
    if (setShowAllUser) setShowAllUser((prev) => !prev);
  };

  // ✅ Filter out logged-in user
  const filteredUsers = users?.filter(
    (u) => u._id !== loggedInUser?._id
  );

  return (
    <aside
      className={`chatSideBarClass fixed top-0 left-0 z-20 h-screen w-full sm:w-80 bg-gray-900 border-r border-gray-700 transform
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        sm:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col`}
    >
      {/* Sidebar Header */}
      <div className="p-4 sm:p-6 border-b border-gray-700">
        <div className="sm:hidden flex justify-end mb-4">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg flex-shrink-0">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex-1 min-w-0 truncate">
            {showAllUser ? "New Chat" : "Messages"}
          </h2>

          <button
            className={`p-2.5 rounded-lg transition-colors flex-shrink-0 ${
              showAllUser
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            } text-white`}
            onClick={handleToggle}
          >
            {showAllUser ? (
              <X className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-hidden px-4 py-2">
        {showAllUser ? (
          <div className="space-y-4 h-full">
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800 text-white rounded-lg 
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Users list */}
            <div className="space-y-2 overflow-y-auto h-full pb-4">
              {!filteredUsers ? (
                <div className="text-gray-400 text-center mt-4">
                  Loading users...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-gray-400 text-center mt-4">
                  No users found
                </div>
              ) : (
                filteredUsers
                  .filter((u) =>
                    u.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((user) => (
                    <button
                      key={user._id}
                      onClick={async () => {
                        setSelectedUser?.(user._id);
                        await createChat?.(user);
                        onChatSelect("", user);
                        setSidebarOpen(false);
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${
                        selectedUser === user._id
                          ? "bg-blue-700"
                          : "bg-gray-800 hover:bg-gray-700"
                      }`}
                    >
                      <div className="relative">
                        <UserCircle className="w-10 h-10 text-gray-300" />
                        {user.isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></span>
                        )}
                      </div>
                      <div className="relative flex-1 min-w-0">
                        <span className="font-medium text-white truncate block">
                          {user.name}
                        </span>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {user.isOnline ? "Online" : "Offline"}
                        </div>
                      </div>
                    </button>
                  ))
              )}
            </div>
          </div>
        ) : chatList && chatList.length > 0 ? (
          <div className="space-y-2 overflow-y-auto h-full pb-4">
            {chatList.map((chatObj, idx) => {
              const { chat } = chatObj;
              const otherUser = chatObj.user;
              if (!otherUser || otherUser._id === loggedInUser?._id) return null;

              const latestMessage =
                chat?.latestMessage?.text || "No messages yet";
              const unseenCount = chat?.unseenCount || 0;
              const isSelected = selectedUser === otherUser._id;

              return (
                <button
                  key={chat._id || idx}
                  onClick={() => {
                    setSelectedUser?.(otherUser._id);
                    onChatSelect(chat._id, otherUser);
                    setChatList((prevChats) => {
                      const clicked = prevChats.find(
                        (c) => c.user._id === otherUser._id
                      );
                      if (!clicked) return prevChats;
                      const remaining = prevChats.filter(
                        (c) => c.user._id !== otherUser._id
                      );
                      return [clicked, ...remaining];
                    });
                  }}
                  className={`w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3 ${
                    isSelected ? "bg-blue-700" : "bg-gray-800 hover:bg-gray-700"
                  }`}
                >
                  <div className="relative">
                    <UserCircle className="w-10 h-10 text-gray-300" />
                    {otherUser.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">
                      {otherUser.name || "Unknown User"}
                    </div>
                    <div className="text-sm text-gray-400 truncate flex items-center">
                      <CornerDownRight
                        size={12}
                        className="mr-1 text-green-400 flex-shrink-0"
                      />
                      <span className="truncate">{latestMessage}</span>
                    </div>
                  </div>

                  {unseenCount > 0 && (
                    <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      {unseenCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <div className="p-4 bg-gray-800 rounded-full mb-3">
              <MessageCircleIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-1 text-white">
              No Chats Yet
            </h3>
            <p className="text-sm text-center text-gray-400">
              Start a conversation by clicking{" "}
              <Plus size={14} className="inline text-green-400" /> above.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="p-4 border-t border-gray-700 space-y-2">
        <Link
          href={"/profile"}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-white transition-colors"
        >
          <UserCircle className="w-5 h-5" /> Profile
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-400 hover:bg-red-700 hover:cursor-pointer text-white transition-colors"
        >
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </footer>
    </aside>
  );
};

export default ChatSidebar;
