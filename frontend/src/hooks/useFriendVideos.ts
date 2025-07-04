import { useEffect, useState } from "react";
import { videoClient } from "../api/grpc/videoClient";
import { GetVideosByUserIdRequest, Video } from "../api/gen/video";
import { useAuth } from "../utils/AuthProvider";

export function useFriendVideos() {
  const { user, getAuthMetadata } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFriendVideos = async () => {
      setLoading(true);
      const req: GetVideosByUserIdRequest = {
        userId: Number(user?.id) || 0,
        currentUserId: Number(user?.id) || 0,
      };

      try {
        const res = await videoClient.GetFriendVideos(req, getAuthMetadata());
        if (res && res.videos && res.videos.length !== 0) {
          setVideos(res.videos.filter((video) => video.isPublished) || []);
        }
      } catch (err) {
        console.error("Failed to fetch friend videos:", err);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFriendVideos();
  }, [user]);

  return { videos, setVideos, loading };
}
