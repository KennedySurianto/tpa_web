import { GrpcWebImpl, WatchServiceClientImpl } from "../gen/watch";
import { BrowserHeaders } from "browser-headers";

const transport = new GrpcWebImpl("http://localhost:8080", {
    transport: undefined,
    metadata: new BrowserHeaders(),
});

export const watchClient = new WatchServiceClientImpl(transport);
