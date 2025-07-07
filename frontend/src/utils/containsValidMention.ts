import type { SendNotificationResponse, SendNotificationToUserRequest } from "../api/gen/notification";
import type { GetUserByUsernameRequest, User } from "../api/gen/user";
import { userClient } from "../api/grpc/userClient";
import { avatarBytesToUrl } from "./avatarConverter";
import defaultAvatar from "../assets/default.jpg";
import { notificationClient } from "../api/grpc/notificationClient";

const getUserByUsername = async (username: string): Promise<User | null> => {
  const req: GetUserByUsernameRequest = { username };

  try {
    const res: User = await userClient.GetUserByUsername(req);
    if (res) {
      return res
    }
  } catch (err) {
    console.error("Failed to validate user:", err);
    return null;
  }
  return null;
};

export const containsValidMention = async (text: string, mentioner: string, mentionerAvatar: Uint8Array): Promise<boolean> => {
  const mentions: RegExpMatchArray | null = text.match(/@(\w+)/g);

  if (!mentions) {
    return false;
  }

  // Iterate through each found mention and validate it.
  for (const mention of mentions) {
    // Remove the leading '@' to get the username.
    const username = mention.substring(1);
    const user: User | null = await getUserByUsername(username);
    
    if (user) {
      const req: SendNotificationToUserRequest = {
        userId: user.id,
        title: "New Mention!",
        body: mentioner + " has mentioned you.",
        iconUrl: avatarBytesToUrl(mentionerAvatar) || defaultAvatar,
      }

      try {
        const res: SendNotificationResponse = await notificationClient.SendNotificationToUser(req);
        return res && res.success;
      } catch (err) {
        console.error(err);
      }
    }
  }

  return false;
};