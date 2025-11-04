import { User } from '@/context/AppContext';
import { Menu, User, User2Icon, UserCircle } from 'lucide-react';
import React from 'react';

interface ChatHeaderProps {
  user: User | null;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isTyping: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ user, setSidebarOpen, isTyping }) => {
  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <div className=" chatHeaderClass sm:hidden fixed top-4 right-4 z-50">
        <button
          className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="w-5 h-5 text-gray-100" />
        </button>
      </div>

      {/* Chat Header */}
      <div className="chatHeaderClass mb-6 bg-gray-800 rounded-lg border border-gray-600 p-6">
        {/* FIX: Corrected typo 'flex-items-center' to 'flex items-center' */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center">
                  <UserCircle className="w-8 h-8 text-gray-300" />
                </div>
                {/* Online user Setup will do later */}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                {/* FIX: Corrected typo 'flex-items-center' to 'flex items-center' */}
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold text-white truncate">
                    {user.name}
                  </h2>
                </div>
                {isTyping && (
                  <p className="text-sm text-green-400">Typing...</p>
                )}
              </div>
              {/* will show real time typing status after socket.io */}
            </>
          ) : (
            <div className=" flex items-center justify-center gap-2 text-center w-full   text-gray-400">
              <div className='w-14 g-14 rounded-full bg-gray-700 flex items-center border-2 rounded-full justify-center'> <User2Icon className='w-8 h-8 text-gray-300'/></div>
             Select a chat to start messaging
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatHeader;