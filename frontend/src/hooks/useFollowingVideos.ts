import { useEffect, useState } from "react";
import { videoClient } from "../api/grpc/videoClient";
import { GetVideosByUserIdRequest, Video } from "../api/gen/video";
import { useAuth } from "../utils/AuthProvider";

export function useFollowingVideos() {
  const { user, loading: authLoading, getAuthMetadata } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFriendVideos = async () => {
      if (authLoading || !user || !user.id) return;

      try {
        const req: GetVideosByUserIdRequest = {
          userId: Number(user.id),
          currentUserId: Number(user.id),
        };

        const res = await videoClient.GetFollowingVideos(req, getAuthMetadata());

        setVideos(res.videos.filter((video) => video.isPublished) || []);
      } catch (err) {
        console.error("Failed to fetch following videos:", err);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFriendVideos();
  }, [user]);

  return { videos, setVideos, loading };
}
