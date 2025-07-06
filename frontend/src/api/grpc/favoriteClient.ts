import { GrpcWebImpl, FavoriteServiceClientImpl } from "../gen/favorite";
import { BrowserHeaders } from "browser-headers";

const transport = new GrpcWebImpl("http://localhost:8080", {
  transport: undefined,
  metadata: new BrowserHeaders(),
});

export const favoriteClient = new FavoriteServiceClientImpl(transport);
