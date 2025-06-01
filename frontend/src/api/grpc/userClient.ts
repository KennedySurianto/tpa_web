import { GrpcWebImpl, UserServiceClientImpl } from "../gen/user";
import { BrowserHeaders } from "browser-headers";

const transport = new GrpcWebImpl("http://localhost:8080", {
    transport: undefined,
    metadata: new BrowserHeaders(),
});

export const userClient = new UserServiceClientImpl(transport);
