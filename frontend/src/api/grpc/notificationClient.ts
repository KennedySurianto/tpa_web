import { GrpcWebImpl, NotificationServiceClientImpl } from "../gen/notification";
import { BrowserHeaders } from "browser-headers";

const transport = new GrpcWebImpl("http://localhost:8080", {
  transport: undefined,
  metadata: new BrowserHeaders(),
});

export const notificationClient = new NotificationServiceClientImpl(transport);
