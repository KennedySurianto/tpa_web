import { GrpcWebImpl, SignalingServiceClientImpl } from "../gen/signaling";
import { BrowserHeaders } from "browser-headers";

const transport = new GrpcWebImpl("http://localhost:8080", {
    transport: undefined,
    metadata: new BrowserHeaders(),
});

export const signalingClient = new SignalingServiceClientImpl(transport);
