import { User } from '@/context/AppContext';
import { Menu, User, User2Icon, UserCircle } from 'lucide-react';
import React from 'react';

interface ChatHeaderProps {
  user: User | null;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isTyping: boolean;
  onlineUsers?: string[] | undefined;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ user, setSidebarOpen, isTyping, onlineUsers }) => {

  const isOnlineUser = user && onlineUsers?.includes(user._id)
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
                  {onlineUsers?.includes(user._id) && (
                    <span className='bg-green-500 border-2 border-gray-800 absolute bottom-0 right-0 w-3 h-3 rounded-full '>
                      <span className="absolute   inset-0 rounded-full bg-green-500 animate-ping opacity-75"></span>
                    </span>
                  )}
                  {/* {
                    !onlineUsers?.includes(user._id) && (
                      <span className='bg-red-500 border-2 border-gray-800 absolute bottom-0 right-0 w-3 h-3 rounded-full '>
                      <span className="absolute   inset-0 rounded-full bg-red-500 animate-ping opacity-75"></span>
                    </span>
                    )
                  } */}

                </div>
                {/* Online user Setup will do later */}
                {/* <div className="absolute text-xs left-3 text-gray-400 mt-0.5">
                  {onlineUsers?.includes(user._id) ? "Online" : "Offline"}
                </div> */}

              </div>


              {/* User Info */}
              <div className="flex-1 min-w-0">
                {/* FIX: Corrected typo 'flex-items-center' to 'flex items-center' */}
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold text-white truncate">
                    {user.name}
                  </h2>
                </div>
                <div className='flex items-center gap-2'>
                  {isTyping ? (
                    <div className='flex items-center gap-2 text-sm'>
                      <div className='flex gap-1'>
                        <div className='animate-pulse bg-gray-400 rounded-full w-2.5 h-2.5'></div>
                        <div className='animate-pulse bg-gray-400 rounded-full w-2.5 h-2.5' style={{animationDelay: '0.1ms'}}></div>
                        <div className='animate-pulse bg-gray-400 rounded-full w-2.5 h-2.5' style={{animationDelay: '0.2ms'}}></div>

                      </div>
                      <span className='text-blue-500 font-medium'>Typing...</span>
                    </div>
                  ) : (
                    <div className='flex items-center gap-2'>
                      <div className={`w-2 h-2 rounded-full ${isOnlineUser?"bg-green-500":"bg-red-500"}`}></div>
                      <span className={`text-sm font-medium ${isOnlineUser?"text-green-500":"text-gray-500"}`}>{isOnlineUser ? "Online" : "Offline"}</span>
                    </div>
                  )}
                </div>
              </div>
              {/* will show real time typing status after socket.io */}
            </>
          ) : (
            <div className=" flex items-center justify-center gap-2 text-center w-full   text-gray-400">
              <div className='w-14 g-14 rounded-full bg-gray-700 flex items-center border-2 rounded-full justify-center'> <User2Icon className='w-8 h-8 text-gray-300' /></div>
              Select a chat to start messaging
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatHeader;