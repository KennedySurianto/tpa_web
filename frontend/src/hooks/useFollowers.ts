import { useEffect, useState } from "react";
import { followClient } from "../api/grpc/followClient";
import type { User } from "../api/gen/user";
import type { FollowList, UserRequest } from "../api/gen/follow";

export function useFollowers(userId: number) {
  const [followers, setFollowers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!userId || Number(userId) === 0) return;

    const fetchFollowings = async () => {
      setLoading(true);
      const req: UserRequest = {
        userId: userId,
      };

      try {
        const res: FollowList = await followClient.GetFollowers(req);

        if (res && res.follows) {
          setFollowers(res.follows.map((f) => f.user).filter((u): u is User => !!u));
          setError("");
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFollowings();
  }, [userId]);

  return { followers, loading, error };
}
