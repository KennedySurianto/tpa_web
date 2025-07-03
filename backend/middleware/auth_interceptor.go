package middleware

import (
	"context"
	"strings"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

type contextKey string

const (
	ContextUserID    contextKey = "user_id"
	ContextEmail     contextKey = "email"
	ContextUsername  contextKey = "username"
)

// UnaryAuthInterceptor returns a gRPC unary interceptor that validates PASETO tokens
func UnaryAuthInterceptor(pasetoMaker *PasetoMaker) grpc.UnaryServerInterceptor {
	return func(
		ctx context.Context,
		req interface{},
		info *grpc.UnaryServerInfo,
		handler grpc.UnaryHandler,
	) (interface{}, error) {
		// Skip token check for certain methods (public)
		if isPublicMethod(info.FullMethod) {
			return handler(ctx, req)
		}

		md, ok := metadata.FromIncomingContext(ctx)
		if !ok {
			return nil, status.Error(codes.Unauthenticated, "missing metadata")
		}

		authHeaders := md["authorization"]
		if len(authHeaders) == 0 {
			return nil, status.Error(codes.Unauthenticated, "authorization header not provided")
		}

		token := strings.TrimPrefix(authHeaders[0], "Bearer ")
		if token == authHeaders[0] {
			return nil, status.Error(codes.Unauthenticated, "invalid token format")
		}

		payload, err := pasetoMaker.VerifyToken(token)
		if err != nil {
			return nil, status.Errorf(codes.Unauthenticated, "invalid token: %v", err)
		}

		// Inject user info into context
		ctx = context.WithValue(ctx, ContextUserID, payload.UserID)
		ctx = context.WithValue(ctx, ContextEmail, payload.Email)
		ctx = context.WithValue(ctx, ContextUsername, payload.Username)

		return handler(ctx, req)
	}
}

// isPublicMethod defines which RPCs are unauthenticated
func isPublicMethod(fullMethod string) bool {
	publicMethods := []string{
		// dicomment -> private routes

		// health check
		"/grpc.health.v1.Health/Check",

		// video.VideoService
		// =========================================
		// "/video.VideoService/CreateVideo",
		"/video.VideoService/GetCaptions",
		"/video.VideoService/GetVideo",
		// "/video.VideoService/UpdateVideo",
		// "/video.VideoService/DeleteVideo",
		"/video.VideoService/GetVideosByUserId",
		"/video.VideoService/GetRecommendedVideos",
		// "/video.VideoService/GetFriendVideos",
		// "/video.VideoService/GetFollowingVideos",
		"/video.VideoService/GetAllVideos",
		"/video.VideoService/GetLikedVideosByUserId",
		"/video.VideoService/GetRandomAd",

		// activity.CommentService
		// =========================================
		"/activity.CommentService/GetComments",
		// "/activity.CommentService/CreateComment",
		"/activity.CommentService/GetCommentCount",
		// "/activity.CommentService/DeleteComment",

		// activity.FollowService
		// =========================================
		// "/activity.FollowService/Follow",
		// "/activity.FollowService/Unfollow",
		"/activity.FollowService/GetFollowers",
		"/activity.FollowService/GetFollowing",
		// "/activity.FollowService/GetFriends",

		// activity.LikeCommentService
		// =========================================
		// "/activity.LikeCommentService/LikeComment",
		// "/activity.LikeCommentService/UnlikeComment",
		"/activity.IsCommentLiked",
		"/activity.LikeCommentService/GetLikeCount",

		// activity.LikeService
		// =========================================
		// "/activity.LikeService/Like",
		// "/activity.LikeService/Unlike",
		"/activity.LikeService/IsLiked",
		"/activity.LikeService/GetVideoLikeCount",
		"/activity.LikeService/GetLikesByUserId",

		// activity.WatchService
		// =========================================
		"/activity.WatchService/Watch",
		"/activity.WatchService/Unwatch",
		"/activity.WatchService/IsWatched",
		"/activity.WatchService/GetViewCount",

		// live.LiveService
		// =========================================
		"/live.LiveService/JoinRoom",
		"/live.LiveService/SendSignal",

		// playlist.PlaylistService
		// =========================================
		// "/playlist.PlaylistService/CreatePlaylist",
		"/playlist.PlaylistService/GetPlaylist",
		"/playlist.PlaylistService/GetPlaylistsByUserId",
		// "/playlist.PlaylistService/DeletePlaylist",
		// "/playlist.PlaylistService/UpdatePlaylist",

		// chat.ChatService
		// =========================================
		// "/chat.ChatService/SendMessage",
		// "/chat.ChatService/UnsendMessage",
		// "/chat.ChatService/GetChatsByUserID",
		// "/chat.ChatService/GetChatsWithUser",
		// "/chat.ChatService/SetTypingStatus",
	}

	for _, m := range publicMethods {
		if fullMethod == m {
			return true
		}
	}
	return false
}
