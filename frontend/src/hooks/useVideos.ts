import { useEffect, useState } from "react";
import { videoClient } from "../api/grpc/videoClient";
import { ListVideosRequest, Video } from "../api/gen/video";
import { useAuth } from "../utils/AuthProvider";

export function useVideos(page: number = 1, limit: number = 10) {
    const { user } = useAuth();
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVideos = async () => {
            if (!user?.id) {
                setVideos([]);
                setLoading(false);
                return;
            }

            const request: ListVideosRequest = {
                page,
                limit,
                userId: Number(user.id),
            };

            const response = await videoClient.ListVideos(request);
            setVideos(response.videos);
            setLoading(false);
        };

        fetchVideos().catch((err) => {
            console.error("Failed to fetch videos", err);
            setLoading(false);
        });
    }, [page, limit, user?.id]); // ✅ Add user?.id to deps

    return { videos, loading };
}
