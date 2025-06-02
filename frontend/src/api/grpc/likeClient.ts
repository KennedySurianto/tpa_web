import { GrpcWebImpl, LikeServiceClientImpl } from "../gen/like";
import { BrowserHeaders } from "browser-headers";

const transport = new GrpcWebImpl("http://localhost:8080", {
    transport: undefined,
    metadata: new BrowserHeaders(),
});

export const likeClient = new LikeServiceClientImpl(transport);
