import { GrpcWebImpl, FollowServiceClientImpl } from "../gen/follow";
import { BrowserHeaders } from "browser-headers";

const transport = new GrpcWebImpl("http://localhost:8080", {
    transport: undefined,
    metadata: new BrowserHeaders(),
});

export const followClient = new FollowServiceClientImpl(transport);
