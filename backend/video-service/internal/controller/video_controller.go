package controller

import (
	"context"
	"fmt"
	"sort"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/KennedySurianto/tpa_web/backend/middleware"
	commentpb "github.com/KennedySurianto/tpa_web/backend/shared/gen/comment"
	followpb "github.com/KennedySurianto/tpa_web/backend/shared/gen/follow"
	likepb "github.com/KennedySurianto/tpa_web/backend/shared/gen/like"
	userpb "github.com/KennedySurianto/tpa_web/backend/shared/gen/user"
	pb "github.com/KennedySurianto/tpa_web/backend/shared/gen/video"
	watchpb "github.com/KennedySurianto/tpa_web/backend/shared/gen/watch"
	"github.com/KennedySurianto/tpa_web/backend/video-service/internal/model"
	"github.com/KennedySurianto/tpa_web/backend/video-service/internal/service"
)

type VideoController struct {
	pb.UnimplementedVideoServiceServer
	videoService service.VideoService
	userClient userpb.UserServiceClient
	likeClient likepb.LikeServiceClient
	followClient followpb.FollowServiceClient
	watchClient watchpb.WatchServiceClient
	commentClient commentpb.CommentServiceClient
}

func NewVideoController(
	videoService service.VideoService, 
	userClient userpb.UserServiceClient, 
	likeClient likepb.LikeServiceClient,
	followClient followpb.FollowServiceClient,
	watchClient watchpb.WatchServiceClient,
	commentClient commentpb.CommentServiceClient,
	) *VideoController {
	return &VideoController{
		videoService: videoService,
		userClient:   userClient,
		likeClient:   likeClient,
		followClient: followClient,
		watchClient:  watchClient,
		commentClient: commentClient,
	}
}

func (s *VideoController) modelToProto(ctx context.Context, video *model.Video, currentUserId uint64) *pb.Video {
	likesCount, commentsCount, viewsCount, isLiked, user, err := s.fetchVideoAttributes(ctx, uint32(video.ID), uint32(video.UserID), uint32(currentUserId))
	if err != nil {
		fmt.Printf("Error fetching video attributes for video %d: %v\n", video.ID, err)
	}

	pbVideo := &pb.Video{
		Id:            uint32(video.ID),
		UserId:        uint32(video.UserID),
		VideoUrl:      video.VideoURL,
		Thumbnail:     video.Thumbnail,
		Caption:       video.Caption,
		Description:   &video.Description,
		Duration:      int32(video.Duration),
		Privacy:       video.Privacy,
		ViewsCount:    uint32(viewsCount),
		IsLiked: 	   isLiked,
		LikesCount:    uint32(likesCount),
		LikeCount:     uint64(likesCount),
		CommentsCount: uint32(commentsCount),
		AllowComments: video.AllowComments,
		AllowDuet:     video.AllowDuet,
		AllowStitch:   video.AllowStitch,
		User: &pb.User{
			Id:       uint64(user.Id),
			Username: user.Username,
			Avatar:   user.Avatar,
		},
		CreatedAt:     timestamppb.New(video.CreatedAt),
		UpdatedAt:     timestamppb.New(video.UpdatedAt),
		IsPublished: video.IsPublished,
	}

	if video.SoundID != nil {
		sid := uint32(*video.SoundID)
		pbVideo.SoundId = &sid
	}

	if !video.DeletedAt.Time.IsZero() {
		pbVideo.DeletedAt = timestamppb.New(video.DeletedAt.Time)
	}

	return pbVideo
}

func (s *VideoController) CreateVideo(ctx context.Context, req *pb.CreateVideoRequest) (*pb.CreateVideoResponse, error) {
	if req.SoundId != nil {
		sid := uint32(*req.SoundId)
		req.SoundId = &sid
	}

	video, err := s.videoService.CreateVideo(req)
	if err != nil {
		return nil, err
	}

	return &pb.CreateVideoResponse{
		Video: s.modelToProto(ctx, video, uint64(req.UserId)),
	}, nil
}

func (vc *VideoController) GetCaptions(ctx context.Context, req *pb.GetCaptionsRequest) (*pb.GetCaptionsResponse, error) {
    captions, err := vc.videoService.GetCaptionsByVideoID(uint(req.VideoId))
    if err != nil {
        return nil, err
    }

    result := make(map[string]*pb.CaptionList)
    for _, c := range captions {
        result[c.Language] = &pb.CaptionList{Lines: c.Texts}
    }

    return &pb.GetCaptionsResponse{Captions: result}, nil
}

func (s *VideoController) GetVideo(ctx context.Context, req *pb.GetVideoRequest) (*pb.GetVideoResponse, error) {
	video, err := s.videoService.GetVideoByID(uint(req.VideoId))
	if err != nil {
		return nil, err
	}

	return &pb.GetVideoResponse{
		Video: s.modelToProto(ctx, video, req.CurrentUserId),
	}, nil
}

func (s *VideoController) UpdateVideo(ctx context.Context, req *pb.UpdateVideoRequest) (*pb.UpdateVideoResponse, error) {
	updateReq := &pb.UpdateVideoRequest{
		Id: req.Id,
	}
	
	if req.Thumbnail != nil {
		updateReq.Thumbnail = req.Thumbnail
	}
	if req.Caption != nil {
		updateReq.Caption = req.Caption
	}
	if req.Privacy != nil {
		updateReq.Privacy = req.Privacy
	}
	if req.AllowComments != nil {
		updateReq.AllowComments = req.AllowComments
	}
	if req.AllowDuet != nil {
		updateReq.AllowDuet = req.AllowDuet
	}
	if req.AllowStitch != nil {
		updateReq.AllowStitch = req.AllowStitch
	}
	if req.IsPublished != nil {
		updateReq.IsPublished = req.IsPublished
	}

	video, err := s.videoService.UpdateVideo(updateReq)
	if err != nil {
		return nil, err
	}

	userID, ok := middleware.GetUserID(ctx)
	if !ok {
		return nil, status.Error(codes.Unauthenticated, "user ID not found in context")
	}

	return &pb.UpdateVideoResponse{
		Video: s.modelToProto(ctx, video, userID),
	}, nil
}

func (s *VideoController) DeleteVideo(ctx context.Context, req *pb.DeleteVideoRequest) (*pb.DeleteVideoResponse, error) {
	err := s.videoService.DeleteVideo(uint(req.Id))
	if err != nil {
		return &pb.DeleteVideoResponse{Success: false}, err
	}
	return &pb.DeleteVideoResponse{Success: true}, nil
}

func (s *VideoController) GetVideosByUserId(ctx context.Context, req *pb.GetVideosByUserIdRequest) (*pb.GetVideosResponse, error) {
	videos, err := s.videoService.GetVideosByUserId(req)
	if err != nil {
		return nil, err
	}

	pbVideos := make([]*pb.Video, len(videos))
	for i, video := range videos {
		pbVideos[i] = s.modelToProto(ctx, &video, uint64(req.CurrentUserId))
	}

	return &pb.GetVideosResponse{ Videos: pbVideos }, nil
}

func (vc *VideoController) GetRecommendedVideos(ctx context.Context, req *pb.GetRecommendedVideosRequest) (*pb.GetVideosResponse, error) {
    videos, err := vc.videoService.GetRecommendedVideos(
        req.GetUserId(),
        req.GetLastVideoId(),
        req.GetDeviceId(),
        req.GetLanguage(),
        req.GetLimit(),
    )
    if err != nil {
        return nil, err
    }

    var response pb.GetVideosResponse
    for _, v := range videos {
        // Skip if this is the currently logged-in user's own video
        if req.UserId != 0 && uint32(v.UserID) == req.UserId {
            continue
        }

		response.Videos = append(response.Videos, vc.modelToProto(ctx, v, uint64(req.UserId)))
    }

    return &response, nil
}

func (vc *VideoController) GetFriendVideos(ctx context.Context, req *pb.GetVideosByUserIdRequest) (*pb.GetVideosResponse, error) {
	userId := req.UserId

	followersResp, err := vc.followClient.GetFollowers(ctx, &followpb.UserRequest{UserId: userId})
	if err != nil {
		return nil, fmt.Errorf("failed to get followers: %w", err)
	}

	followingResp, err := vc.followClient.GetFollowing(ctx, &followpb.UserRequest{UserId: userId})
	if err != nil {
		return nil, fmt.Errorf("failed to get following: %w", err)
	}

	followerMap := make(map[uint32]bool)
	for _, f := range followersResp.Follows {
		followerMap[f.FollowerId] = true
	}

	var friendIds []uint32
	friendIdMap := make(map[uint32]bool)
	for _, f := range followingResp.Follows {
		if followerMap[f.FollowedId] {
			friendIds = append(friendIds, f.FollowedId)
			friendIdMap[f.FollowedId] = true
		}
	}

	var allVideos []model.Video
	for _, friendID := range friendIds {
		videos, err := vc.videoService.GetVideosByUserId(&pb.GetVideosByUserIdRequest{UserId: friendID})
		if err == nil {
			allVideos = append(allVideos, videos...)
		}
	}

	if len(allVideos) == 0 {
		return vc.GetRecommendedVideos(ctx, &pb.GetRecommendedVideosRequest{
            UserId: req.CurrentUserId,
            LastVideoId: 0,
            DeviceId: 0,
            Language: "",
            Limit: 10,
        })
	}

	sort.Slice(allVideos, func(i, j int) bool {
		return allVideos[i].CreatedAt.After(allVideos[j].CreatedAt)
	})

	var pbVideos []*pb.Video
	for _, v := range allVideos {
		pbVideos = append(pbVideos, vc.modelToProto(ctx, &v, uint64(req.CurrentUserId)))
	}

	return &pb.GetVideosResponse{Videos: pbVideos }, nil
}

func (vc *VideoController) GetFollowingVideos(ctx context.Context, req *pb.GetVideosByUserIdRequest) (*pb.GetVideosResponse, error) {
	userId := req.UserId

	followingResp, err := vc.followClient.GetFollowing(ctx, &followpb.UserRequest{UserId: userId})
	if err != nil {
		return nil, fmt.Errorf("failed to get following: %w", err)
	}

	var allVideos []model.Video
	followingIDs := make(map[uint64]bool)

	for _, f := range followingResp.Follows {
		followedId := uint64(f.FollowedId)
		followingIDs[followedId] = true

		videos, err := vc.videoService.GetVideosByUserId(&pb.GetVideosByUserIdRequest{UserId: uint32(f.FollowedId)})
		if err == nil {
			allVideos = append(allVideos, videos...)
		}
	}

	if len(allVideos) == 0 {
		return vc.GetRecommendedVideos(ctx, &pb.GetRecommendedVideosRequest{
            UserId: req.CurrentUserId,
            LastVideoId: 0,
            DeviceId: 0,
            Language: "",
            Limit: 10,
        })
	}

	sort.Slice(allVideos, func(i, j int) bool {
		return allVideos[i].CreatedAt.After(allVideos[j].CreatedAt)
	})

	var pbVideos []*pb.Video
	for _, v := range allVideos {
		user, err := vc.userClient.GetUserById(ctx, &userpb.GetUserByIdRequest{Id: uint64(v.UserID)})
		if err != nil {
			fmt.Printf("Error fetching user %d: %v\n", v.UserID, err)
			user = &userpb.User{Id: 0, Username: "Unknown"}
		}

		p := vc.modelToProto(ctx, &v, uint64(req.CurrentUserId))
		p.User = &pb.User{Id: user.Id, Username: user.Username, Avatar: user.Avatar}
		pbVideos = append(pbVideos, p)
	}

	return &pb.GetVideosResponse{Videos: pbVideos }, nil
}

func (vc *VideoController) fetchVideoAttributes(
    ctx context.Context, 
    videoId uint32,
	userId uint32,
    currentUserId uint32,
) (uint64, uint64, uint64, bool, *userpb.User, error) {
    // Fetch Likes Count
    likeResp, _ := vc.likeClient.GetVideoLikeCount(ctx, &likepb.GetVideoLikeCountRequest{VideoId: videoId})
	likesCount := uint64(0);
    if likeResp != nil {
        likesCount = likeResp.Count;
    }

	// Fetch views count from watch service (if applicable)
	viewsResp, _ := vc.watchClient.GetViewCount(ctx, &watchpb.GetViewCountRequest{VideoId: videoId})
	viewsCount := uint64(0)
	if viewsResp != nil {
		viewsCount = uint64(viewsResp.Count)
	}

    // Fetch Comments Count
	commentResp, _ := vc.commentClient.GetCommentCount(ctx, &commentpb.GetCommentCountRequest{VideoId: videoId})
	commentsCount := uint64(0)
	if commentResp != nil {
		commentsCount = commentResp.Count
	}

    // Fetch IsLiked status for the user if userId is provided
    isLiked := false
    if currentUserId != 0 {
        likeResp, err := vc.likeClient.IsLiked(ctx, &likepb.IsLikedRequest{
            UserId:  currentUserId,
            VideoId: videoId,
        })
        if err != nil || likeResp == nil {
            isLiked = false
			fmt.Println("Error fetching like status:", err)
        } else {
            isLiked = likeResp.Liked
			fmt.Println("Like status for video", videoId, "by user", currentUserId, "is", isLiked)
        }
    }

    // Fetch user info if available
	var user *userpb.User
	if userId != 0 {
		var err error
		user, err = vc.userClient.GetUserById(ctx, &userpb.GetUserByIdRequest{Id: uint64(userId)})
		if err != nil {
			return likesCount, commentsCount, viewsCount, isLiked, nil, fmt.Errorf("failed to fetch user info: %v", err)
		}
	}

	return likesCount, commentsCount, viewsCount, isLiked, user, nil
}

func (vc *VideoController) GetAllVideos(ctx context.Context, req *pb.GetVideosByUserIdRequest) (*pb.GetVideosResponse, error) {
	videos, err := vc.videoService.GetAllVideos()
	if err != nil {
		return nil, err
	}

	pbVideos := make([]*pb.Video, len(videos))
	for i, v := range videos {
		pbVideos[i] = vc.modelToProto(ctx, &v, uint64(req.CurrentUserId))
	}

	return &pb.GetVideosResponse{
		Videos: pbVideos,
	}, nil
}

func (vc *VideoController) GetLikedVideosByUserId(ctx context.Context, req *pb.GetVideosByUserIdRequest) (*pb.GetVideosResponse, error) {
	// Step 1: Call service to fetch liked videos (use userId as the liked user)
	videos, err := vc.videoService.GetLikedVideosByUserId(req.UserId)
	if err != nil {
		return nil, fmt.Errorf("failed to get liked videos: %w", err)
	}

	// Step 2: Convert to proto
	var pbVideos []*pb.Video
	for _, v := range videos {
		pbVideos = append(pbVideos, vc.modelToProto(ctx, v, uint64(req.CurrentUserId)))
	}

	return &pb.GetVideosResponse{Videos: pbVideos}, nil
}

