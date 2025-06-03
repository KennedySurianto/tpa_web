import { useEffect, useState, useCallback } from 'react';
import {
    GetCommentsRequest,
    Comment,
} from '../api/gen/comment';
import { commentClient } from '../api/grpc/commentClient';

export const useComments = (userId: number, videoId: number) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchComments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const request: GetCommentsRequest = { 
                userId: userId.toString(),
                videoId: videoId.toString()
            };
            const response = await commentClient.GetComments(request);
            console.log(response.comments);
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
