import { useEffect, useState } from "react";
import { videoClient } from "../api/grpc/videoClient";
import { GetVideosByUserIdRequest, Video } from "../api/gen/video";
import { useAuth } from "../utils/AuthProvider";

export function useFollowingVideos() {
    const { user } = useAuth();
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFriendVideos = async () => {
            try {
                const req: GetVideosByUserIdRequest = { userId: Number(user?.id) || 0 };
                const res = await videoClient.GetFollowingVideos(req);
                setVideos(res.videos);
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
