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
            if (!user) return;
            console.log("fetchVideos is called");

            // If no user id, pass empty string for anonymous
            const userId: number = Number(user.id) || 0;
            console.log("[useVideos.ts] userId: ", userId);

            const request: GetRecommendedVideosRequest = {
                userId: userId,
                limit,
                lastVideoId: Number(lastVideoId),
                deviceId: 0,
                language: navigator.language || "",
            };

            try {
                const response = await videoClient.GetRecommendedVideos(request);
                console.log(response.videos);
                setVideos(prev => {
                    const existingIds = new Set(prev.map(v => v.id));
                    const uniqueNewVideos = response.videos.filter(v => !existingIds.has(v.id));
                    return [...prev, ...uniqueNewVideos];
                });
            } catch (err) {
                console.error("Failed to fetch recommended videos", err);
                setVideos([]);
            } finally {
                setLoading(false);
            }
        };

        setLoading(true);
        fetchVideos();
    }, [user]);

    return { videos, setVideos, loading };
}
