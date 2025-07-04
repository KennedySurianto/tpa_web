import { useEffect, useState } from "react";
import { videoClient } from "../api/grpc/videoClient";
import { GetRandomAdRequest, GetRecommendedVideosRequest, Video } from "../api/gen/video";
import { useAuth } from "../utils/AuthProvider";

const VIDEO_INTERVAL = 1;

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
        const videoResponse = await videoClient.GetRecommendedVideos(request);

        const videosWithAds: Video[] = [];
        if (videoResponse && videoResponse.videos) {
          console.log("Fetched recommended videos:", videoResponse.videos);
          const rawVideos = videoResponse.videos.filter((video) => video.isPublished);

          for (let i = 0; i < rawVideos.length; i++) {
            videosWithAds.push(rawVideos[i]);

            if ((i + 1) % VIDEO_INTERVAL === 0) {
              const adReq: GetRandomAdRequest = {};
              try {
                const adRes: Video = await videoClient.GetRandomAd(adReq);
                if (adRes) {
                  videosWithAds.push(adRes);
                }
              } catch (adErr) {
                console.error("[useVideos.ts] Failed to fetch ad:", adErr);
              }
            }
          }
        }

        setVideos(videosWithAds || []);
      } catch (err) {
        console.error("[useVideos.ts] Failed to fetch recommended videos", err);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [user?.id]);

  return { videos, setVideos, loading };
}
