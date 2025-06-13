import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../utils/AuthProvider";
import { GetChatsWithUserRequest, SendMessageRequest } from "../../api/gen/chat";
import type { GetUserByUsernameRequest, User } from "../../api/gen/user";
import { userClient } from "../../api/grpc/userClient";
import { chatClient } from "../../api/grpc/chatClient";
import ChatWebSocket from "../../components/ChatWebSocket";

type Message = {
    id: number;
    sender: string; // changed to string for usernames
    text: string;
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
    const hasFetchedMessages = useRef(false);

    useEffect(() => {
        const fetchUser = async () => {
            if (!receiverUsername) {
                // setError('Username is missing.');
                // setLoading(false);
                return;
            }

            try {
                const req: GetUserByUsernameRequest = { username: receiverUsername };
                const res: User = await userClient.GetUserByUsername(req);

                if (res) {
                    setReceiver(res);
                }
            } catch (err) {
                console.error('Error fetching user:', err);
                // setError('Failed to fetch user data.');
            } finally {
                // setLoading(false);
            }
        };

        fetchUser();
    }, [receiverUsername, user]);

    useEffect(() => {
        if (!user || hasFetchedMessages.current || !receiver) return;

        const fetchMessages = async () => {
            console.log("user1Id: ", user.id, "|user2Id: ", receiver?.id || "0");
            try {
                const req: GetChatsWithUserRequest = { 
                    user1Id: user.id, 
                    user2Id: receiver?.id.toString() || "0" };
                const res = await chatClient.GetChatsWithUser(req);

                if (res) {
                    res.chats.forEach((chat) => {
                    const message: Message = {
                        id: nextId.current++,
                        sender: chat.senderId === user.id ? user.username : receiverUsername || "Unknown",
                        text: chat.message,
                    };
                    setMessages((prev) => [...prev, message]);
                    });
                }
            } catch (err) {
                console.error("Failed to fetch messages:", err);
            }
        };

        fetchMessages();
        hasFetchedMessages.current = true;
    }, [user, receiver]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleIncomingMessage = (msg: any) => {
        console.log("Incoming Messaging: ", msg);
        if (!user || !receiver) return;

        const isFromReceiver = msg.sender_id === Number(receiver.id);
        const isFromMe = msg.sender_id === Number(user.id) && msg.receiver_id === Number(receiver.id);
        console.log("msg.sender_id:", msg.sender_id, " | type: ", typeof(msg.sender_id));
        console.log("receiver.id:", receiver.id, " | type: ", typeof(receiver.id));
        console.log("user.id:", user.id, " | type: ", typeof(user.id));
        console.log("isFromReceiver: ", isFromReceiver);
        console.log("isFromMe: ", isFromMe);

        if (!isFromReceiver && !isFromMe) return;

        const senderName = isFromMe ? user.username : receiver.username;

        const receivedMessage: Message = {
            id: nextId.current++,
            sender: senderName,
            text: msg.message,
        };
        setMessages((prev) => [...prev, receivedMessage]);
    };

    const sendMessage = async (type: string) => {
        if (!input.trim()) return;
        if (!user) {
            alert("You must be logged in to send messages.");
            return;
        }
        if (!receiver) {
            alert("No receiver specified.");
        return;
        }

        const text = input.trim();

        // Show message in UI immediately
        const myMessage: Message = { id: nextId.current++, sender: user.username, text };
        setMessages((prev) => [...prev, myMessage]);
        setInput("");

        // Prepare gRPC request with sender, receiver, and text
        const req: SendMessageRequest = {
            senderId: user.id,
            receiverId: receiver.id,
            type: type,
            message: text,
        }

        try {
            const resp = await chatClient.SendMessage(req);
            const replyText = resp.chat;

            if (resp && replyText) {
                // const replyMessage: Message = { id: nextId.current++, sender: receiver.username, text: replyText.message };
                // setMessages((prev) => [...prev, replyMessage]);
                console.log("success");
            }

        } catch (err) {
            console.error("Send message failed:", err);
            const errorMessage: Message = { id: nextId.current++, sender: "system", text: "Failed to send message." };
            setMessages((prev) => [...prev, errorMessage]);
        }
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
        e.preventDefault();
        sendMessage("text");
        }
    };

    if (user) {
        return (
            <>
                <ChatWebSocket key={`${user.id}-${receiver?.id}`} userId={Number(user.id)} onMessage={handleIncomingMessage} />
                <div
                style={{
                    height: '100vh',
                    overflowY: 'auto',
                    margin: "0 auto",
                    display: "flex",
                    flexDirection: "column",
                    border: "1px solid #ddd",
                    borderRadius: 6,
                }}
                className="w-100"
                >
                    {/* Header */}
                    <div
                        style={{
                            padding: "12px 16px",
                            borderBottom: "1px solid #ddd",
                            backgroundColor: "#f0f0f0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontWeight: "bold",
                        }}
                    >
                        <span style={{ cursor: "pointer" }} onClick={() => navigate(-1)}>⬅</span>
                        <span>💬 {receiver?.username || "..."}</span>
                        <span>⋯</span>
                    </div>
                    <div
                        style={{
                        flex: 1,
                        padding: 10,
                        overflowY: "auto",
                        backgroundColor: "#f9f9f9",
                        }}
                    >
                        {messages.map((m) => (
                            <div
                                key={m.id}
                                style={{
                                marginBottom: 10,
                                display: "flex",
                                justifyContent: m.sender === user?.username ? "flex-end" : "flex-start",
                                }}
                            >
                                <div
                                style={{
                                    backgroundColor: m.sender === user?.username ? "#0084ff" : "#e5e5ea",
                                    color: m.sender === user?.username ? "white" : "black",
                                    padding: "8px 12px",
                                    borderRadius: 20,
                                    maxWidth: "70%",
                                    wordBreak: "break-word",
                                }}
                                >
                                <b>{m.sender === user?.username ? "You" : m.sender}</b>: {m.text}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <div style={{ display: "flex", padding: 10, borderTop: "1px solid #ddd" }}>
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
                            border: "1px solid #ccc",
                            outline: "none",
                        }}
                        disabled={!receiver || !user}
                        />
                        <button
                        onClick={() => sendMessage("text")}
                        disabled={!receiver || !user}
                        style={{
                            marginLeft: 10,
                            padding: "10px 20px",
                            borderRadius: 20,
                            border: "none",
                            backgroundColor: receiver && user ? "#0084ff" : "#aaa",
                            color: "white",
                            fontWeight: "bold",
                            cursor: receiver && user ? "pointer" : "not-allowed",
                        }}
                        >
                        Send
                        </button>
                    </div>
                </div>
            </>
        );
    } else {
        return (
            <div style={{ textAlign: "center", marginTop: 50 }}>
                <h2>Please log in to access the chat</h2>
            </div>
        );
    }
}
