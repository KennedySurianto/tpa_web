import { GrpcWebImpl, PlaylistServiceClientImpl } from "../gen/playlist";
import { BrowserHeaders } from "browser-headers";

const transport = new GrpcWebImpl("http://localhost:8080", {
  transport: undefined,
  metadata: new BrowserHeaders(),
});

export const playlistClient = new PlaylistServiceClientImpl(transport);
