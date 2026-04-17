import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { fetchWithAuth } from "../util/api";

import { socket } from "../socket";

export type Category = "Movies" | "TV" | "Music";

export interface RecPayload {
  title: string;
  category: Category;
  rating: number;
  notes: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  messageText: string;
  createdAt: string;
  type: "text" | "rec";
  recPayload?: RecPayload;
  isRead: boolean;
}

//build a Rec Message
export const buildRecMessage = (senderId: string, receiverId: string, payload: RecPayload): ChatMessage => ({
  id: Date.now().toString(),
  senderId,
  receiverId,
  messageText: `Check out this ${payload.category}: ${payload.title}`,
  createdAt: new Date().toISOString(),
  type: "rec",
  recPayload: payload,
  isRead: false,
});

// API stub
export const messageApi = {
  sendMessage: async (senderId: string, receiverId: string, messageText: string) => {
    console.log("Saving to DB...", { senderId, receiverId, messageText });
  }
};

const ChatWindow = ({ friend, currentUserId, onClose, injectMsg, onAddRec }: any) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const BLUE = "#1e5cc2";
  const fId = friend.id

  const roomId = [currentUserId, friend.id].sort().join("_");

  useEffect(() => {
    if (!fId) return;
    socket.auth = {token: localStorage.getItem("accessToken")};
    socket.connect();
    socket.emit("join_chat", { roomId });

    // load history
    fetchWithAuth(`/api/messages/${currentUserId}/${friend.id}`)
    .then(res => res.json())
    .then(data => setMessages(data));

    // handle incoming Socket messages
    const handleMsg = (msg: ChatMessage) => {
      if (msg.senderId === friend.id) {
          setMessages(prev => [...prev, msg]);
      }
    };

    socket.on("receive_message", handleMsg);
    return () => {
      socket.off("receive_message", handleMsg);
      socket.emit("leave_chat", { roomId });
    };
  }, [fId, currentUserId]);

  useEffect(() => {
      if (injectMsg) setMessages(prev => [...prev, injectMsg]);
  }, [injectMsg]);

  useEffect(() => {
    const markAsRead = async () => {
        await fetchWithAuth(`/api/messages/mark-read`, {
            method: "POST",
            body: JSON.stringify({ 
                currentUserId: currentUserId, 
                friendId: friend.id 
            })
        });
    };

    markAsRead();
  }, [friend.id]); //run again if we switch friends or a new message arrives

  const send = () => {
    if (!input.trim()) return;
    const msg: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUserId,
      receiverId: fId,
      messageText: input,
      createdAt: new Date().toISOString(),
      type: "text",
      isRead: false
    };
    socket.emit("send_message", msg);
    setMessages(prev => [...prev, msg]);
    setInput("");
  };

  return (
    <div className="w-80 h-[450px] bg-white rounded-t-2xl shadow-2xl border border-stone-200 flex flex-col overflow-hidden">
      {/* HEADER */}
      <header 
        className="px-4 py-3 flex justify-between items-center border-b border-stone-100 shrink-0 shadow-sm"
        style={{ backgroundColor: 'white' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {friend.username[0].toUpperCase()}
          </div>
          <span className="font-bold text-stone-800 text-sm">@{friend.username}</span>
        </div>
        <button onClick={() => onClose(friend.id)} className="text-stone-400 hover:text-stone-600 transition">
          <X size={18} />
        </button>
      </header>

      {/* MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 bg-stone-50/50">
        {messages.map((m) => {
          const isMe = m.senderId === currentUserId;
          return (
            <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              <div 
                className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm shadow-sm ${
                  isMe 
                    ? "text-white rounded-tr-none" 
                    : "bg-white text-stone-700 border border-stone-100 rounded-tl-none"
                }`}
                style={{ backgroundColor: isMe ? BLUE : "" }}
              >
                {m.messageText}

                {/* Recommendation Attachment */}
                {m.type === "rec" && m.recPayload && (
                  <div className="mt-2 pt-2 border-t border-white/20">
                    <button 
                      className={`w-full py-1.5 rounded-lg text-xs font-bold transition ${
                        isMe ? "bg-white/20 text-white hover:bg-white/30" : "bg-stone-100 text-blue-600 hover:bg-stone-200"
                      }`}
                      onClick={() => onAddRec(m.recPayload!)}
                    >
                      + Save to Library
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* INPUT AREA */}
      <div className="p-3 border-t border-stone-100 bg-white">
        <div className="flex items-center gap-2 bg-stone-100 rounded-full px-4 py-2 border border-stone-200 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100 transition">
          <input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Aa"
            className="flex-1 bg-transparent text-sm outline-none text-stone-800 placeholder-stone-400"
          />
        </div>
      </div>
    </div>
  );
};

interface Friend {
  id: string;
  username: string;
}

interface ChatLayerProps {
  friends: Friend[];
  openChatIds: string[];
  onClose: (id: string) => void;
  injectMessages: Record<string, ChatMessage | null>;
  onAddRec: (rec: any) => void;
}

export default function ChatLayer({ friends, openChatIds, onClose, injectMessages, onAddRec }: ChatLayerProps) {
  const currentUserId = localStorage.getItem("userId") || "";

  return (
    <div className="fixed bottom-0 right-64 z-40 flex flex-row-reverse items-end gap-3 pointer-events-none p-4">
      {openChatIds.map(id => {
        const friend = friends.find(f => f.id === id);
        if (!friend) return null;

        return (
          <div key={id} className="pointer-events-auto">
             <ChatWindow 
                friend={friend} 
                currentUserId={currentUserId}
                onClose={onClose}
                injectMsg={injectMessages[id]}
                onAddRec={onAddRec}
              />
          </div>
        );
      })}
    </div>
  );
}