import { GrpcWebImpl, VideoServiceClientImpl } from "../gen/video";
import { BrowserHeaders } from "browser-headers";

const transport = new GrpcWebImpl("http://localhost:8080", {
  transport: undefined,
  metadata: new BrowserHeaders(),
});

export const videoClient = new VideoServiceClientImpl(transport);
