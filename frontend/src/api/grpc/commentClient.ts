import { GrpcWebImpl, CommentServiceClientImpl } from "../gen/comment";
import { BrowserHeaders } from "browser-headers";

const transport = new GrpcWebImpl("http://localhost:8080", {
  transport: undefined,
  metadata: new BrowserHeaders(),
});

export const commentClient = new CommentServiceClientImpl(transport);
