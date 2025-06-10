// src/components/ws/ChatWebSocket.tsx
import { useEffect } from "react";
import type { Chat } from "../api/gen/chat";

type Props = {
    userId: number;
    onMessage: (message: Chat) => void;
};

export default function ChatWebSocket({ userId, onMessage }: Props) {
    useEffect(() => {
        const ws = new WebSocket(`ws://${window.location.hostname}:8080/ws?user_id=${userId}`);

        ws.onopen = () => console.log("✅ WebSocket connected");

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            console.log("📨 WebSocket received:", msg);
            onMessage(msg);
        };

        ws.onclose = () => console.log("❌ WebSocket disconnected");
        ws.onerror = (err) => console.error("⚠️ WebSocket error", err);

        return () => {
            ws.close();
        };
    }, [userId, onMessage]);

    return null;
}
