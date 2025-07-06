import { useEffect, useState } from "react";
import { videoClient } from "../api/grpc/videoClient";
import { GetVideosByUserIdRequest, Video } from "../api/gen/video";
import { useAuth } from "../utils/AuthProvider";

export function useFriendVideos() {
  const { user, loading: authLoading, getAuthMetadata } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user || !user.id) return;

    const fetchFriendVideos = async () => {
      setLoading(true);
      const req: GetVideosByUserIdRequest = {
        userId: Number(user.id) || 0,
        currentUserId: Number(user.id) || 0,
      };

      try {
        const res = await videoClient.GetFriendVideos(req, getAuthMetadata());
        console.log("friends videos res: ", res)
        if (res && res.videos) {
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
  }, [authLoading, user?.id]);

  return { videos, setVideos, loading };
}
