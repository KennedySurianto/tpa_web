import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../utils/AuthProvider";
import { GetChatsWithUserRequest, SendMessageRequest, UnsendMessageRequest } from "../../api/gen/chat";
import type { GetUserByUsernameRequest, User } from "../../api/gen/user";
import { userClient } from "../../api/grpc/userClient";
import { chatClient } from "../../api/grpc/chatClient";
import ChatWebSocket from "../../components/ChatWebSocket";
import { avatarBytesToUrl } from "../../utils/avatarConverter";
import defaultAvatar from "../../assets/default.jpg";

type Message = {
  id: number; // local message ID for React rendering
  messageId?: string; // server-side message ID
  sender: string;
  text: string;
  deleted?: boolean;
};

export default function ChatPage() {
  const { user } = useAuth();
  const { receiverUsername } = useParams<{ receiverUsername: string }>();

  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [receiver, setReceiver] = useState<User | null>(null);
  const [input, setInput] = useState("");
  const nextId = useRef(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!receiverUsername) return;
      try {
        const req: GetUserByUsernameRequest = { username: receiverUsername };
        const res: User = await userClient.GetUserByUsername(req);
        if (res) setReceiver(res);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    fetchUser();
  }, [receiverUsername]);

  useEffect(() => {
    if (!user || !receiver) return;

    const fetchMessages = async () => {
      try {
        const req: GetChatsWithUserRequest = {
          user1Id: user.id,
          user2Id: receiver.id.toString(),
        };
        const res = await chatClient.GetChatsWithUser(req);

        if (res) {
          const loadedMessages: Message[] = res.chats.map((chat) => ({
            id: nextId.current++,
            messageId: chat.id,
            sender: chat.senderId === user.id ? user.username : receiver.username || "Unknown",
            text: chat.message,
            deleted: chat.deletedAt && chat.deletedAt !== "" ? true : false,
          }));
          setMessages(loadedMessages);
        }
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };

    fetchMessages();
  }, [user, receiver?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

    const handleIncomingMessage = (msg: any) => {
        console.log('incoming msg: ', msg)
        if (msg.type === "unsend") {
            console.log("🔁 Unsend received:", msg.messageId);
            setMessages((prev) =>
                prev.map((m) =>
                    m.messageId === msg.messageId ? { ...m, deleted: true, text: "" } : m
                )
            );
            return;
        }

        // fallback for normal message
        const isFromReceiver = msg.sender_id === Number(receiver?.id);
        const isFromMe = user && msg.sender_id === Number(user.id) && msg.receiver_id === Number(receiver?.id);
        if (!isFromReceiver && !isFromMe) return;

        const senderName = isFromMe ? user.username : receiver?.username || "Unknown";
        const newMessage: Message = {
            id: nextId.current++,
            messageId: msg.id,
            sender: senderName,
            text: msg.message,
        };

        setMessages((prev) => [...prev, newMessage]);
    };

    const sendMessage = async (type: string) => {
        if (!input.trim()) return;
        if (!user || !receiver) return;

        const text = input.trim();
        const myMessage: Message = {
        id: nextId.current++,
        sender: user.username,
        text,
        };
        setMessages((prev) => [...prev, myMessage]);
        setInput("");

        const req: SendMessageRequest = {
        senderId: user.id,
        receiverId: receiver.id,
        type,
        message: text,
        };

        try {
        const resp = await chatClient.SendMessage(req);
        if (resp && resp.chat && resp.chat.id) {
            setMessages((prev) =>
            prev.map((m) =>
                m.id === myMessage.id ? { ...m, messageId: resp.chat!.id } : m
            )
            );
        }
        } catch (err) {
        console.error("Send message failed:", err);
        const errorMessage: Message = {
            id: nextId.current++,
            sender: "system",
            text: "Failed to send message.",
        };
        setMessages((prev) => [...prev, errorMessage]);
        }
    };

    const handleUnsendMessage = async (message: Message) => {
        if (!message.messageId || !user || !receiver) return;

        try {
            const req: UnsendMessageRequest = { 
                chatId: Number(message.messageId),
                senderId: Number(user.id),
                receiverId: Number(receiver.id)
            };
            await chatClient.UnsendMessage(req);

            setMessages((prev) =>
                prev.map((m) =>
                    m.messageId === message.messageId ? { ...m, deleted: true, text: "" } : m
                )
            );
        } catch (err) {
            console.error("Unsend failed:", err);
        }
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
        e.preventDefault();
        sendMessage("text");
        }
    };

    if (!user) {
        return (
        <div style={{ textAlign: "center", marginTop: 50 }}>
            <h2>Please log in to access the chat</h2>
        </div>
        );
    }

  return (
    <>
      <ChatWebSocket
        key={`${user.id}-${receiver?.id}`}
        userId={Number(user.id)}
        onMessage={handleIncomingMessage}
      />
      <div
        style={{
          height: "100vh",
          overflowY: "auto",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#1e1e1e",
          color: "#e6e6e6",
          borderLeft: "1px solid #333",
          borderRight: "1px solid #333",
        }}
        className="w-100"
      >
        {/* Header */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #333",
            backgroundColor: "#2a2a2a",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontWeight: "bold",
            color: "#fff",
          }}
        >
          <span style={{ cursor: "pointer" }} onClick={() => navigate(-1)}>
            ⬅
          </span>
          <span>💬 {receiver?.username || "..."}</span>
          <span></span>
        </div>

        {/* Chat messages */}
        <div
          style={{
            flex: 1,
            padding: 10,
            overflowY: "auto",
            backgroundColor: "#1e1e1e",
          }}
        >
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                marginBottom: 12,
                display: "flex",
                justifyContent: m.sender === user.username ? "flex-end" : "flex-start",
                alignItems: "flex-end",
                position: "relative",
                gap: 8,
              }}
            >
              {/* Avatar for receiver */}
              {m.sender !== user.username && (
                <img
                  src={receiver?.avatar ? avatarBytesToUrl(receiver.avatar) || defaultAvatar : defaultAvatar}
                  alt={m.sender}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              )}

              <div
                style={{
                  backgroundColor: m.sender === user.username ? "#4a90e2" : "#3a3a3a",
                  color: "white",
                  padding: "8px 12px",
                  borderRadius: 16,
                  maxWidth: "70%",
                  wordBreak: "break-word",
                  fontSize: 14,
                }}
              >
                {m.deleted ? (
                  <i style={{ opacity: 0.5, fontStyle: "italic" }}>Message unsent</i>
                ) : (
                  m.text
                )}
              </div>

              {/* Unsend button for sender */}
              {m.sender === user.username && !m.deleted && (
                <button
                  onClick={() => handleUnsendMessage(m)}
                  style={{
                    position: "absolute",
                    top: -5,
                    right: -5,
                    fontSize: 12,
                    padding: "2px 6px",
                    borderRadius: 12,
                    border: "none",
                    backgroundColor: "#d9534f",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                  title="Unsend"
                >
                  ×
                </button>
              )}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div
          style={{
            display: "flex",
            padding: 12,
            borderTop: "1px solid #333",
            backgroundColor: "#2a2a2a",
            alignItems: "center",
            gap: 10,
          }}
        >
          {/* Attach button */}
          <label
            htmlFor="fileUpload"
            style={{
              backgroundColor: "#444",
              color: "#ccc",
              borderRadius: "50%",
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: 18,
            }}
            title="Attach File"
          >
            📎
          </label>
          <input
            id="fileUpload"
            type="file"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                // TODO: implement file upload logic
                console.log("Selected file:", file.name);
              }
            }}
          />

          {/* Text input */}
          <input
            type="text"
            placeholder={`Message to ${receiver?.username || "..."}`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            style={{
              flex: 1,
              padding: 10,
              fontSize: 16,
              borderRadius: 20,
              border: "1px solid #555",
              backgroundColor: "#121212",
              color: "#f0f0f0",
              outline: "none",
            }}
            disabled={!receiver || !user}
          />

          {/* Send button */}
          <button
            onClick={() => sendMessage("text")}
            disabled={!receiver || !user}
            style={{
              padding: "10px 20px",
              borderRadius: 20,
              border: "none",
              backgroundColor: receiver && user ? "#4a90e2" : "#555",
              color: "#fff",
              fontWeight: "bold",
              cursor: receiver && user ? "pointer" : "not-allowed",
              transition: "background 0.2s ease",
            }}
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
}
