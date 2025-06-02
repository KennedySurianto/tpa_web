import { useEffect, useState, useCallback } from 'react';
import {
    GetCommentsRequest,
    Comment,
} from '../api/gen/activity';
import { activityClient } from '../api/grpc/activityClient';

export const useComments = (videoId: number) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchComments = useCallback(async () => {
        setLoading(true);
        setError(null);
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
    }, [videoId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    return { comments, loading, error, refetch: fetchComments };
};
