import { useEffect, useState } from "react";
import { videoClient } from "../api/grpc/videoClient";
import { GetRecommendedVideosRequest, Video } from "../api/gen/video";
import { useAuth } from "../utils/AuthProvider";

export function useVideos(limit: number = 10, lastVideoId: string = "") {
  const { user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      console.log("fetchVideos is called");

      // Allow unauthenticated users — use 0
      const userId: number = Number(user?.id) || 0;
      console.log("[useVideos.ts] userId:", userId);

      const request: GetRecommendedVideosRequest = {
        userId,
        limit,
        lastVideoId: Number(lastVideoId),
        deviceId: 0,
        language: navigator.language || "",
      };

      try {
        const response = await videoClient.GetRecommendedVideos(request);
        console.log("Fetched recommended videos:", response.videos);
        setVideos(response.videos || []);
      } catch (err) {
        console.error("Failed to fetch recommended videos", err);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [user?.id]);

  return { videos, setVideos, loading };
}
