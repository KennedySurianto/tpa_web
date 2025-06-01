import { useEffect, useState } from "react";
import { videoClient } from "../api/grpc/videoClient";
import { GetRecommendedVideosRequest, Video } from "../api/gen/video";
import { useAuth } from "../utils/AuthProvider";

export function useVideos(
    limit: number = 10,
    lastVideoId: string = ""
) {
    const { user } = useAuth();
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVideos = async () => {
        // If no user id, pass empty string for anonymous
        const userId = user?.id ? String(user.id) : "";

        const request: GetRecommendedVideosRequest = {
            userId: userId,
            limit,
            lastVideoId: lastVideoId,
            deviceId: "",  // replace this with actual device ID
            language: navigator.language || "",  // get from user preferences
        };

        try {
            const response = await videoClient.GetRecommendedVideos(request);
            setVideos(response.videos);
        } catch (err) {
            console.error("Failed to fetch recommended videos", err);
            setVideos([]);
        } finally {
            setLoading(false);
        }
        };

        setLoading(true);
        fetchVideos();
    }, [limit, lastVideoId, user?.id]);

    return { videos, loading };
}
