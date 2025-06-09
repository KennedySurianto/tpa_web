import { GrpcWebImpl, ChatServiceClientImpl } from "../gen/chat";
import { BrowserHeaders } from "browser-headers";

const transport = new GrpcWebImpl("http://localhost:8080", {
    transport: undefined,
    metadata: new BrowserHeaders(),
});

export const chatClient = new ChatServiceClientImpl(transport);
