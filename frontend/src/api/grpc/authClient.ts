import { GrpcWebImpl, AuthServiceClientImpl } from "../gen/auth";
import { BrowserHeaders } from "browser-headers";

const transport = new GrpcWebImpl("http://localhost:8080", {
    transport: undefined,
    metadata: new BrowserHeaders(),
});

export const authClient = new AuthServiceClientImpl(transport);
