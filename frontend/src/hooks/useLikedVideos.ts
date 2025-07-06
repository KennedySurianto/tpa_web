import { useEffect, useState } from "react";
import { videoClient } from "../api/grpc/videoClient";
import type { Video, GetVideosByUserIdRequest } from "../api/gen/video";
import { useAuth } from "../utils/AuthProvider";

export function useLikedVideos(userId: number) {
  const { user, loading: authLoading } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !userId || Number.isNaN(userId)) return;

    const fetchLikedVideos = async () => {
      const currentUserId: number = Number(user?.id) ?? 0;

      setLoading(true);
      try {
        const req: GetVideosByUserIdRequest = {
          userId: Number(userId),
          currentUserId: Number(currentUserId),
        };
        const res = await videoClient.GetLikedVideosByUserId(req);
        setVideos(res.videos.filter((video) => video.isPublished) || []);
        console.log(
          "liked videos: ",
          res.videos.filter((video) => video.isPublished),
        );
      } catch (error) {
        console.error("Failed to fetch liked videos:", error);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedVideos();
  }, [authLoading, user?.id, userId]);

  return { videos, loading };
}
