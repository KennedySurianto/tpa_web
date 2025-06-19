import { GrpcWebImpl, LiveServiceClientImpl } from "../gen/live";
import { BrowserHeaders } from "browser-headers";

const transport = new GrpcWebImpl("http://localhost:8080", {
    transport: undefined,
    metadata: new BrowserHeaders(),
});

export const liveClient = new LiveServiceClientImpl(transport);
