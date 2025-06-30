import { useEffect, useState } from "react";
import { videoClient } from "../api/grpc/videoClient";
import { GetVideoRequest, Video } from "../api/gen/video";
import { useAuth } from "../utils/AuthProvider";

export function useSpecificVideo(videoId: string) {
    const { user } = useAuth();
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !user.id) return;

        const fetchSpecificVideo = async () => {
            try {
                const req: GetVideoRequest = { 
                    videoId: videoId, 
                    currentUserId: user?.id?.toString() || "0" 
                };
                const res = await videoClient.GetVideo(req);
                setVideos(res.video ? [res.video] : []);
            } catch (err) {
                console.error("Failed to fetch specific video:", err);
                setVideos([]);
            } finally {
                setLoading(false);
            }
        };

        if (videoId) {
            fetchSpecificVideo();
        }
    }, [videoId, user]);

    return { videos, setVideos, loading };
}
