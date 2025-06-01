import { GrpcWebImpl, CommentsServiceClientImpl } from "../gen/activity";
import { BrowserHeaders } from "browser-headers";

const transport = new GrpcWebImpl("http://localhost:8080", {
    transport: undefined,
    metadata: new BrowserHeaders(),
});

export const activityClient = new CommentsServiceClientImpl(transport);
