import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Send,
  Paperclip,
  MoreVertical,
  Phone,
  Video,
  ArrowLeft,
  X,
  Check,
  CheckCheck,
  Clock,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "../../utils/AuthProvider";
import type {
  GetChatsWithUserRequest,
  SendMessageRequest,
  SetTypingStatusRequest,
  UnsendMessageRequest,
} from "../../api/gen/chat";
import type { GetUserByUsernameRequest, User } from "../../api/gen/user";
import { userClient } from "../../api/grpc/userClient";
import { chatClient } from "../../api/grpc/chatClient";
import ChatWebSocket from "../../components/ChatWebSocket";
import { avatarBytesToUrl } from "../../utils/avatarConverter";
import defaultAvatar from "../../assets/default.jpg";
import BreathingBubble from "../../components/BreathingBubble";

type Message = {
  id: number; // local message ID for React rendering
  messageId?: string; // server-side message ID
  sender: string;
  text: string;
  imageBytes?: Uint8Array; // actual image
  deleted?: boolean;
  timestamp?: string;
  status?: "sending" | "sent" | "delivered" | "read";
};

export default function ChatPage() {
  const { user, getAuthMetadata } = useAuth();
  const { receiverUsername } = useParams<{ receiverUsername: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [receiver, setReceiver] = useState<User | null>(null);
  const [input, setInput] = useState("");
  const nextId = useRef(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTyping = () => {
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    sendTypingStatus(true);
    typingTimeout.current = setTimeout(() => {
      sendTypingStatus(false);
    }, 1500);
  };

  const sendTypingStatus = async (isTyping: boolean) => {
    if (!user || !receiver) return;

    const req: SetTypingStatusRequest = {
      senderId: user.id,
      receiverId: receiver.id,
      isTyping: isTyping, // true for typing, false for stop typing
    };

    try {
      await chatClient.SetTypingStatus(req, getAuthMetadata());
      console.log("Success set typing status :", isTyping);
    } catch (err) {
      console.log("Error set typing status: ", err);
    }
  };

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

        const res = await chatClient.GetChatsWithUser(req, getAuthMetadata());
        if (res) {
          const loadedMessages: Message[] = res.chats.map((chat) => ({
            id: nextId.current++,
            messageId: chat.id,
            sender: chat.senderId === user.id ? user.username : receiver.username || "Unknown",
            text: chat.message,
            imageBytes: chat.image,
            deleted: chat.deletedAt && chat.deletedAt !== "" ? true : false,
            timestamp: chat.createdAt,
            status: "delivered",
          }));

          setMessages(loadedMessages);
        }
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };

    fetchMessages();
  }, [user, receiver]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages]);

  const handleIncomingMessage = (msg: any) => {
    if (msg.type === "unsend") {
      setMessages((prev) =>
        prev.map((m) =>
          m.messageId === msg.messageId
            ? { ...m, deleted: true, text: "", imageBytes: undefined }
            : m,
        ),
      );
      return;
    } else if (msg.type === "typing") {
      console.log("typing incoming msg: ", msg);
      if (msg.is_typing) {
        setIsTyping(true);
      } else {
        setIsTyping(false);
      }
      return;
    }

    const isFromReceiver = msg.sender_id === Number(receiver?.id);
    const isFromMe =
      user && msg.sender_id === Number(user.id) && msg.receiver_id === Number(receiver?.id);

    if (!isFromReceiver && !isFromMe) return;

    const senderName = isFromMe ? user.username : receiver?.username || "Unknown";

    const imageBytes: Uint8Array | undefined = msg.image
      ? new Uint8Array(
          atob(msg.image)
            .split("")
            .map((c) => c.charCodeAt(0)),
        )
      : undefined;

    console.log("incoming message imageBytes: ", imageBytes);

    const newMessage: Message = {
      id: nextId.current++,
      messageId: msg.id,
      sender: senderName,
      text: msg.message || "",
      imageBytes,
      timestamp: new Date().toISOString(),
      status: "delivered",
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
      timestamp: new Date().toISOString(),
      status: "sending",
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
      const resp = await chatClient.SendMessage(req, getAuthMetadata());
      if (resp && resp.chat && resp.chat.id) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === myMessage.id ? { ...m, messageId: resp.chat!.id, status: "sent" } : m,
          ),
        );
      }
    } catch (err) {
      console.error("Send message failed:", err);
      setMessages((prev) =>
        prev.map((m) => (m.id === myMessage.id ? { ...m, status: "sent" } : m)),
      );
    }
  };

  const handleUnsendMessage = async (message: Message) => {
    if (!message.messageId || !user || !receiver) return;

    try {
      const req: UnsendMessageRequest = {
        chatId: Number(message.messageId),
        senderId: Number(user.id),
        receiverId: Number(receiver.id),
      };

      await chatClient.UnsendMessage(req, getAuthMetadata());
      setMessages((prev) =>
        prev.map((m) =>
          m.messageId === message.messageId ? { ...m, deleted: true, text: "" } : m,
        ),
      );
    } catch (err) {
      console.error("Unsend failed:", err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !receiver) return;

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const myMessage: Message = {
      id: nextId.current++,
      sender: user.username,
      text: "",
      imageBytes: uint8Array,
      timestamp: new Date().toISOString(),
      status: "sending",
    };

    setMessages((prev) => [...prev, myMessage]);

    const req: SendMessageRequest = {
      senderId: user.id,
      receiverId: receiver.id,
      type: "image",
      message: "",
      image: uint8Array,
    };

    try {
      const resp = await chatClient.SendMessage(req, getAuthMetadata());
      if (resp && resp.chat && resp.chat.id) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === myMessage.id ? { ...m, messageId: resp.chat!.id, status: "sent" } : m,
          ),
        );
      }
    } catch (err) {
      console.error("Send image failed:", err);
      setMessages((prev) =>
        prev.map((m) => (m.id === myMessage.id ? { ...m, status: "sent" } : m)),
      );
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage("text");
    }
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "sending":
        return <Clock size={12} className="status-icon sending" />;
      case "sent":
        return <Check size={12} className="status-icon sent" />;
      case "delivered":
        return <CheckCheck size={12} className="status-icon delivered" />;
      case "read":
        return <CheckCheck size={12} className="status-icon read" />;
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="error-container">
        <div className="error-content">
          <h2>Authentication Required</h2>
          <p>Please log in to access the chat</p>
        </div>
      </div>
    );
  }

  if (!receiverUsername || !receiver) {
    return (
      <>
        <div className="empty-chat-container">
          <div className="empty-chat-content">
            <div className="empty-icon-container">
              <MessageCircle size={64} className="empty-icon" />
              <div className="icon-pulse"></div>
            </div>
            <div className="empty-text-content">
              <h2 className="empty-title">No Conversation Selected</h2>
              <p className="empty-description">
                Choose a friend from your conversations to start chatting
              </p>
              <div className="empty-features">
                <div className="feature-item">
                  <Send size={16} />
                  <span>Send messages instantly</span>
                </div>
                <div className="feature-item">
                  <Paperclip size={16} />
                  <span>Share photos and files</span>
                </div>
                <div className="feature-item">
                  <Phone size={16} />
                  <span>Make voice and video calls</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          .empty-chat-container {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%);
            color: #ffffff;
            padding: 2rem;
            position: relative;
            overflow: hidden;
          }

          .empty-chat-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%);
            pointer-events: none;
          }

          .empty-chat-content {
            text-align: center;
            max-width: 480px;
            width: 100%;
            position: relative;
            z-index: 1;
          }

          .empty-icon-container {
            position: relative;
            display: inline-block;
            margin-bottom: 2rem;
          }

          .empty-icon {
            color: #3b82f6;
            opacity: 0.8;
            animation: float 3s ease-in-out infinite;
          }

          .icon-pulse {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 120px;
            height: 120px;
            border: 2px solid rgba(59, 130, 246, 0.3);
            border-radius: 50%;
            animation: pulse 2s ease-in-out infinite;
          }

          .empty-text-content {
            animation: fadeInUp 0.6s ease-out;
          }

          .empty-title {
            margin: 0 0 1rem 0;
            font-size: 2rem;
            font-weight: 700;
            background: linear-gradient(135deg, #ffffff, #e5e7eb);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            line-height: 1.2;
          }

          .empty-description {
            margin: 0 0 2.5rem 0;
            font-size: 1.1rem;
            color: #9ca3af;
            line-height: 1.5;
            font-weight: 400;
          }

          .empty-features {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            align-items: center;
          }

          .feature-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.875rem 1.5rem;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 0.875rem;
            color: #d1d5db;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            width: 100%;
            max-width: 280px;
            justify-content: flex-start;
          }

          .feature-item:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(59, 130, 246, 0.3);
            transform: translateY(-2px);
            color: #ffffff;
          }

          .feature-item svg {
            color: #3b82f6;
            flex-shrink: 0;
          }

          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-10px);
            }
          }

          @keyframes pulse {
            0%, 100% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 0.3;
            }
            50% {
              transform: translate(-50%, -50%) scale(1.1);
              opacity: 0.1;
            }
          }

          @keyframes fadeInUp {
            0% {
              opacity: 0;
              transform: translateY(20px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @media (max-width: 768px) {
            .empty-chat-container {
              padding: 1.5rem;
            }

            .empty-title {
              font-size: 1.75rem;
            }

            .empty-description {
              font-size: 1rem;
              margin-bottom: 2rem;
            }

            .empty-icon {
              width: 56px;
              height: 56px;
            }

            .icon-pulse {
              width: 100px;
              height: 100px;
            }

            .feature-item {
              padding: 0.75rem 1.25rem;
              font-size: 0.85rem;
            }
          }
        `}</style>
      </>
    );
  }

  return (
    <>
      <ChatWebSocket
        key={`${user.id}-${receiver?.id}`}
        userId={Number(user.id)}
        onMessage={handleIncomingMessage}
      />

      <div className="chat-container">
        {/* Header */}
        <div className="chat-header">
          <div className="header-left">
            <button className="back-button">
              <ArrowLeft size={20} />
            </button>
            <div className="user-info">
              <div className="avatar-container">
                <img
                  src={
                    receiver?.avatar
                      ? avatarBytesToUrl(receiver.avatar) || defaultAvatar
                      : defaultAvatar
                  }
                  alt={receiver?.username}
                  className="user-avatar"
                />
              </div>
              <div className="user-details">
                <h3 className="username">{receiver?.displayName || receiver?.username}</h3>
                <span className="status">{isTyping && "typing..."}</span>
              </div>
            </div>
          </div>
          <div className="header-actions">
            <button className="action-button">
              <Phone size={20} />
            </button>
            <button className="action-button">
              <Video size={20} />
            </button>
            <button className="action-button">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="messages-container">
          <div className="messages-list">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message-wrapper ${message.sender === user.username ? "sent" : "received"}`}
              >
                {message.sender !== user.username && (
                  <div className="message-avatar">
                    <img
                      src={
                        receiver?.avatar
                          ? avatarBytesToUrl(receiver.avatar) || defaultAvatar
                          : defaultAvatar
                      }
                      alt={message.sender}
                      className="avatar-small"
                    />
                  </div>
                )}

                <div className="message-bubble-container">
                  <div
                    className={`message-bubble ${message.sender === user.username ? "sent" : "received"}`}
                  >
                    {message.deleted ? (
                      <div className="deleted-message">
                        <span>Message was deleted</span>
                      </div>
                    ) : (
                      <>
                        {message.text && <div className="message-text">{message.text}</div>}
                        {message.imageBytes && message.imageBytes.length > 0 && (
                          <div className="message-image">
                            <img
                              src={avatarBytesToUrl(message.imageBytes) || ""}
                              alt="Sent"
                              className="image-content"
                            />
                          </div>
                        )}
                      </>
                    )}

                    {/* Message Info */}
                    <div className="message-info">
                      <span className="message-time">{formatTime(message.timestamp)}</span>
                      {message.sender === user.username && getStatusIcon(message.status)}
                    </div>
                  </div>

                  {/* Unsend Button */}
                  {message.sender === user.username && !message.deleted && (
                    <button
                      onClick={() => handleUnsendMessage(message)}
                      className="unsend-button"
                      title="Delete message"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="typing-indicator-wrapper">
                <div className="message-avatar">
                  <img
                    src={
                      receiver?.avatar
                        ? avatarBytesToUrl(receiver.avatar) || defaultAvatar
                        : defaultAvatar
                    }
                    alt={receiver?.username}
                    className="avatar-small"
                  />
                </div>
                <BreathingBubble receiver={receiver} />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="input-container">
          <div className="input-wrapper">
            <button
              className="attachment-button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach file"
            >
              <Paperclip size={20} />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="file-input"
            />

            <div className="text-input-container">
              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  handleTyping();
                }}
                onKeyDown={onKeyDown}
                placeholder={`Message ${receiver?.displayName || receiver?.username}...`}
                className="text-input"
                rows={1}
                disabled={!receiver || !user}
              />
            </div>

            <button
              onClick={() => sendMessage("text")}
              disabled={!input.trim() || !receiver || !user}
              className={`send-button ${input.trim() ? "active" : ""}`}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .chat-container {
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%);
          color: #ffffff;
          overflow: hidden;
          isolation: isolate;
        }

        .error-container {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%);
          color: #ffffff;
        }

        .error-content {
          text-align: center;
          padding: 2rem;
        }

        .error-content h2 {
          margin: 0 0 1rem 0;
          color: #ffffff;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .error-content p {
          margin: 0;
          color: #9ca3af;
          font-size: 1rem;
        }

        .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          flex-shrink: 0;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .back-button {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #ffffff;
          padding: 0.5rem;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .back-button:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .avatar-container {
          position: relative;
        }

        .user-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(255, 255, 255, 0.1);
        }

        .online-indicator {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid #1a1a1a;
        }

        .online-indicator.online {
          background: #10b981;
          box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.3);
        }

        .online-indicator.offline {
          background: #6b7280;
        }

        .user-details {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .username {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #ffffff;
        }

        .status {
          font-size: 0.8rem;
          color: #9ca3af;
          font-weight: 400;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .action-button {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #9ca3af;
          padding: 0.75rem;
          border-radius: 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-button:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }

        .messages-container {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .messages-list {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 1rem;
          scroll-behavior: auto;
        }

        .messages-list::-webkit-scrollbar {
          width: 6px;
        }

        .messages-list::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }

        .messages-list::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .messages-list::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .message-wrapper {
          display: flex;
          margin-bottom: 1rem;
          gap: 0.75rem;
          align-items: flex-end;
        }

        .message-wrapper.sent {
          justify-content: flex-end;
        }

        .message-wrapper.received {
          justify-content: flex-start;
        }

        .message-avatar {
          flex-shrink: 0;
        }

        .avatar-small {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .message-bubble-container {
          position: relative;
          max-width: 70%;
        }

        .message-bubble {
          padding: 0.875rem 1.125rem;
          border-radius: 1.25rem;
          position: relative;
          word-wrap: break-word;
          word-break: break-word;
        }

        .message-bubble.sent {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: #ffffff;
          border-bottom-right-radius: 0.375rem;
          margin-left: auto;
        }

        .message-bubble.received {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
          border-bottom-left-radius: 0.375rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .deleted-message {
          font-style: italic;
          opacity: 0.6;
          color: #9ca3af;
        }

        .message-text {
          font-size: 0.95rem;
          line-height: 1.4;
          margin-bottom: 0.25rem;
        }

        .message-image {
          margin-top: 0.5rem;
          border-radius: 0.75rem;
          overflow: hidden;
        }

        .image-content {
          max-width: 250px;
          width: 100%;
          height: auto;
          display: block;
          border-radius: 0.75rem;
        }

        .message-info {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.375rem;
          margin-top: 0.25rem;
        }

        .message-time {
          font-size: 0.7rem;
          opacity: 0.7;
          color: inherit;
        }

        .status-icon {
          opacity: 0.7;
        }

        .status-icon.sending {
          color: #9ca3af;
        }

        .status-icon.sent {
          color: #d1d5db;
        }

        .status-icon.delivered {
          color: #d1d5db;
        }

        .status-icon.read {
          color: #3b82f6;
        }

        .unsend-button {
          position: absolute;
          top: -8px;
          right: -8px;
          background: rgba(239, 68, 68, 0.9);
          border: none;
          color: #ffffff;
          padding: 0.25rem;
          border-radius: 50%;
          cursor: pointer;
          opacity: 0;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
        }

        .message-bubble-container:hover .unsend-button {
          opacity: 1;
        }

        .unsend-button:hover {
          background: rgba(239, 68, 68, 1);
          transform: scale(1.1);
        }

        .typing-indicator-wrapper {
          display: flex;
          align-items: flex-end;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .input-container {
          padding: 1rem 1.5rem;
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          flex-shrink: 0;
        }

        .input-wrapper {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          max-width: 100%;
        }

        .attachment-button,
        .send-button {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #9ca3af;
          padding: 0.875rem;
          border-radius: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 44px;
          height: 100%;
        }

        .file-input {
          display: none;
        }

        .text-input-container {
          flex: 1;
          position: relative;
        }

        .text-input {
          width: 100%;
          height: 100%;
          padding: 0.875rem 1.125rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 1.375rem;
          color: #ffffff;
          font-size: 0.95rem;
          font-family: inherit;
          resize: none;
          outline: none;
          transition: all 0.2s ease;
          overflow-y: hidden;
        }

        .text-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          background: rgba(255, 255, 255, 0.08);
        }

        .text-input::placeholder {
          color: #9ca3af;
        }

        .text-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .send-button {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #9ca3af;
          padding: 0.875rem;
          border-radius: 0.875rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .send-button.active {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: #ffffff;
          transform: scale(1.05);
        }

        .send-button:hover:not(:disabled) {
          transform: scale(1.1);
        }

        .send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        @media (max-width: 768px) {
          .chat-header {
            padding: 0.875rem 1rem;
          }

          .header-left {
            gap: 0.75rem;
          }

          .user-avatar {
            width: 40px;
            height: 40px;
          }

          .username {
            font-size: 1rem;
          }

          .messages-list {
            padding: 0.75rem;
          }

          .message-bubble-container {
            max-width: 85%;
          }

          .input-container {
            padding: 0.875rem 1rem;
          }

          .input-wrapper {
            gap: 0.5rem;
          }

          .attachment-button,
          .send-button {
            padding: 0.75rem;
          }

          .text-input {
            padding: 0.75rem 1rem;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </>
  );
}
