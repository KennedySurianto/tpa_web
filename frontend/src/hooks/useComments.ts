import { useEffect, useState } from 'react';
import {
  GetCommentsRequest,
  Comment,
} from '../api/gen/activity';
import { activityClient } from '../api/grpc/activityClient';

export const useComments = (videoId: number) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchComments = async () => {
        setLoading(true);
        try {
            const request: GetCommentsRequest = { videoId: videoId.toString() };
            const response = await activityClient.GetComments(request);
            setComments(response.comments);
        } catch (err: any) {
            console.error('Failed to fetch comments:', err);
            setError(err?.message || 'Unknown error');
        } finally {
            setLoading(false);
        }
        };

        fetchComments();
    }, [videoId]);

    return { comments, loading, error };
};
