import { useEffect, useState } from "react";
import { useAuth } from "../utils/AuthProvider";
import { Video } from "../api/gen/video";
import { GetFavoriteVideosByUserIdRequest } from "../api/gen/favorite";
import { favoriteClient } from "../api/grpc/favoriteClient";

export function useFavoriteVideos(userId : string) {
  const { user: currentUser, loading: authLoading } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    const fetchFavoriteVideos = async () => {
      setLoading(true);

      const req: GetFavoriteVideosByUserIdRequest = {
        userId: userId || "0",
        currentUserId: currentUser?.id || "0",
      };

      try {
        const res = await favoriteClient.GetFavoriteVideosByUserId(req);
        
        console.log("Favorite videos response: ", res);

        if (res && res.videos) {
          setVideos(res.videos.filter((video) => video.isPublished) || []);
        }
      } catch (err) {
        console.error("Failed to fetch favorite videos:", err);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFavoriteVideos();
  }, [authLoading, currentUser, userId]);

  return { videos, setVideos, loading };
}
