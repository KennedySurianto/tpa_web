import { GrpcWebImpl, LikeCommentServiceClientImpl } from "../gen/like_comment";
import { BrowserHeaders } from "browser-headers";

const transport = new GrpcWebImpl("http://localhost:8080", {
  transport: undefined,
  metadata: new BrowserHeaders(),
});

export const likeCommentClient = new LikeCommentServiceClientImpl(transport);
