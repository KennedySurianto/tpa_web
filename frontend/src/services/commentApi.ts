import {
    GetCommentsRequest,
    GetCommentsResponse,
    CreateCommentRequest,
    CreateCommentResponse,
} from '../api/gen/activity';
import { activityClient } from '../api/grpc/activityClient';
import { useAuth } from '../utils/AuthProvider';

/**
 * Fetch comments for a video.
 * @param videoId The ID of the video
 * @returns List of comments
 */
export async function getComments(videoId: number) {
    try {
        const request: GetCommentsRequest = { videoId: videoId.toString() };
        const response: GetCommentsResponse = await activityClient.GetComments(request);
        return response.comments;
    } catch (error) {
        console.error('Error fetching comments:', error);
        throw error;
    }
}

/**
 * Create a new comment.
 * @param userId ID of the user
 * @param videoId ID of the video
 * @param content The comment text
 * @returns The newly created comment
 */
export async function createComment(videoId: number, content: string) {
    const user = useAuth().user;
    if (!user || !user.id) {
        throw new Error('User is not authenticated or missing user ID');
    }

    try {
        const request: CreateCommentRequest = {
            userId: user.id,
            videoId: videoId.toString(),
            content,
        };
        const response: CreateCommentResponse = await activityClient.CreateComment(request);
        return response;
    } catch (error) {
        console.error('Error creating comment:', error);
        throw error;
    }
}
