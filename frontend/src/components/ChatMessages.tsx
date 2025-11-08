import { Message } from "@/app/chat/page";
import { User } from "@/context/AppContext";
import React, { useEffect, useMemo, useRef } from "react";
import moment from "moment";
import { Check, CheckCheck } from "lucide-react";

interface ChatMessagesProps {
  selectedUser: string | null;
  messages: Message[] | null;
  loggedInUser: User | null;
}

const ChatMessages = ({
  selectedUser,
  messages,
  loggedInUser,
}: ChatMessagesProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  const uniqueMessages = useMemo(() => {
    if (!messages) return [];
    const seen = new Set();
    return messages.filter((m) => {
      if (seen.has(m._id)) return false;
      seen.add(m._id);
      return true;
    });
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedUser, uniqueMessages]);
  
  // Handle both _id and id properties
  const currentUserId = loggedInUser?._id || (loggedInUser as any)?.id;
  // console.log("=== DEBUG INFO ===");
  // console.log("loggedInUser:", loggedInUser);
  // console.log("currentUserId:", currentUserId);
  // console.log("messages:", messages);
  // console.log("==================");

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div
        className={`flex-1 overflow-y-auto p-4 space-y-3 custom-scroll ${
          !selectedUser ? "flex items-center justify-center" : ""
        }`}
      >
        {!selectedUser ? (
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-16 h-16 text-gray-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
              />
            </svg>
            <p className="text-lg font-medium">Select a chat to start messaging</p>
          </div>
        ) : (
          <>
            {uniqueMessages.map((msg, i) => {
              const isSentByMe = msg.sender === currentUserId;
              const uniqueKey = `${msg._id}-${i}`;
              
              return (
                <div
                  key={uniqueKey}
                  className={`flex ${isSentByMe ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[70%]`}>
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isSentByMe
                          ? "bg-blue-600 text-white rounded-br-sm"
                          : "bg-gray-700 text-white rounded-bl-sm"
                      }`}
                    >
                      {/* Image content */}
                      {msg.messageType === "image" && msg.image && (
                        <div className="mb-2">
                          <img
                            src={msg.image.url}
                            alt="shared"
                            className="max-w-full h-auto rounded-lg"
                            loading="lazy"
                          />
                        </div>
                      )}
                      
                      {/* Text content */}
                      {msg.text && (
                        <p className="text-sm break-words whitespace-pre-wrap">
                          {msg.text}
                        </p>
                      )}

                     

                      {/* Timestamp and status */}
                      <div
                        className={`flex items-center gap-1.5 mt-1 text-xs ${
                          isSentByMe ? "justify-end text-blue-200" : "text-gray-400"
                        }`}
                      >
                         {/* Read receipt */}
                      {isSentByMe && (
                          <span className="inline-flex">
                            {msg.seen ? (
                              <CheckCheck className="w-4 h-4" strokeWidth={2} />
                            ) : (
                              <Check className="w-4 h-4" strokeWidth={2} />
                            )}
                          </span>
                        )}
                        {/* time based on seen and created */}
                        <span>
                          {msg.seen
                            ? moment(msg.seenAt).format("hh:mm A")
                            : moment(msg.createdAt).format("hh:mm A")}
                        </span>

                        
                        {/* date based on seen and created */}
                        <span>
                          {msg.seen
                            ? moment(msg.seenAt).format("MMM D, YYYY")
                            : moment(msg.createdAt).format("MMM D, YYYY")}
                        </span>

                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </>
        )}
      </div>
    </div>
  );
};

export default ChatMessages;