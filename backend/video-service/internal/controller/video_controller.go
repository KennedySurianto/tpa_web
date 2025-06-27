package controller

import (
	"context"
	"fmt"
	"sort"

	"google.golang.org/protobuf/types/known/timestamppb"

	followpb "github.com/KennedySurianto/tpa_web/backend/shared/gen/follow"
	likepb "github.com/KennedySurianto/tpa_web/backend/shared/gen/like"
	userpb "github.com/KennedySurianto/tpa_web/backend/shared/gen/user"
	watchpb "github.com/KennedySurianto/tpa_web/backend/shared/gen/watch"
	commentpb "github.com/KennedySurianto/tpa_web/backend/shared/gen/comment"
	pb "github.com/KennedySurianto/tpa_web/backend/shared/gen/video"
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

func (s *VideoController) modelToProto(ctx context.Context, video *model.Video) *pb.Video {
	likesCount, commentsCount, viewsCount, isLiked, user, err := s.fetchVideoAttributes(ctx, uint32(video.ID), uint32(video.UserID))
	if err != nil {
		fmt.Printf("Error fetching video attributes for video %d: %v\n", video.ID, err)
	}

	pbVideo := &pb.Video{
		Id:            uint32(video.ID),
		UserId:        uint32(video.UserID),
		VideoUrl:      video.VideoURL,
		Thumbnail:     video.Thumbnail,
		Caption:       video.Caption,
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
		Video: s.modelToProto(ctx, video),
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
	video, err := s.videoService.GetVideoByID(uint(req.Id))
	if err != nil {
		return nil, err
	}

	return &pb.GetVideoResponse{
		Video: s.modelToProto(ctx, video),
	}, nil
}

func (s *VideoController) UpdateVideo(ctx context.Context, req *pb.UpdateVideoRequest) (*pb.UpdateVideoResponse, error) {
	updateReq := &pb.UpdateVideoRequest{}

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

	video, err := s.videoService.UpdateVideo(updateReq)
	if err != nil {
		return nil, err
	}

	return &pb.UpdateVideoResponse{
		Video: s.modelToProto(ctx, video),
	}, nil
}

func (s *VideoController) DeleteVideo(ctx context.Context, req *pb.DeleteVideoRequest) (*pb.DeleteVideoResponse, error) {
	err := s.videoService.DeleteVideo(uint(req.Id))
	if err != nil {
		return &pb.DeleteVideoResponse{Success: false}, err
	}
	return &pb.DeleteVideoResponse{Success: true}, nil
}

func (s *VideoController) GetVideosByUserId(ctx context.Context, req *pb.GetVideosByUserIdRequest) (*pb.GetVideosByUserIdResponse, error) {
	req = &pb.GetVideosByUserIdRequest{
		UserId:  req.UserId,
	}

	videos, total, err := s.videoService.GetVideosByUserId(req)
	if err != nil {
		return nil, err
	}

	pbVideos := make([]*pb.Video, len(videos))
	for i, video := range videos {
		pbVideos[i] = s.modelToProto(ctx, &video)
	}

	return &pb.GetVideosByUserIdResponse{
		Videos: pbVideos,
		Total:  int32(total),
	}, nil
}

func (s *VideoController) UpdateMetrics(ctx context.Context, req *pb.UpdateMetricsRequest) (*pb.UpdateMetricsResponse, error) {
	updateReq := &pb.UpdateMetricsRequest{}

	if req.ViewsCount != nil {
		val := uint32(*req.ViewsCount)
		updateReq.ViewsCount = &val
	}
	if req.LikesCount != nil {
		val := uint32(*req.LikesCount)
		updateReq.LikesCount = &val
	}
	if req.CommentsCount != nil {
		val := uint32(*req.CommentsCount)
		updateReq.CommentsCount = &val
	}

	video, err := s.videoService.UpdateMetrics(updateReq)
	if err != nil {
		return nil, err
	}

	return &pb.UpdateMetricsResponse{
		Video: s.modelToProto(ctx, video),
	}, nil
}
func (vc *VideoController) GetRecommendedVideos(ctx context.Context, req *pb.GetRecommendedVideosRequest) (*pb.GetRecommendedVideosResponse, error) {
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

    var response pb.GetRecommendedVideosResponse
    for _, v := range videos {
        // Skip if this is the currently logged-in user's own video
        if req.UserId != 0 && uint32(v.UserID) == req.UserId {
            continue
        }

		response.Videos = append(response.Videos, vc.modelToProto(ctx, v))
    }

    return &response, nil
}

func (vc *VideoController) GetFriendVideos(ctx context.Context, req *pb.GetVideosByUserIdRequest) (*pb.GetVideosByUserIdResponse, error) {
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
		videos, _, err := vc.videoService.GetVideosByUserId(&pb.GetVideosByUserIdRequest{UserId: friendID})
		if err == nil {
			allVideos = append(allVideos, videos...)
		}
	}

	if len(allVideos) == 0 {
		recommended, _ := vc.videoService.GetRecommendedVideos(userId, 0, 0, "", 10)
		for _, v := range recommended {
			if !friendIdMap[uint32(v.UserID)] {
				allVideos = append(allVideos, *v)
			}
		}
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

		p := vc.modelToProto(ctx, &v)
		p.User = &pb.User{Id: user.Id, Username: user.Username, Avatar: user.Avatar}
		pbVideos = append(pbVideos, p)
	}

	return &pb.GetVideosByUserIdResponse{Videos: pbVideos, Total: int32(len(pbVideos))}, nil
}

func (vc *VideoController) GetFollowingVideos(ctx context.Context, req *pb.GetVideosByUserIdRequest) (*pb.GetVideosByUserIdResponse, error) {
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

		videos, _, err := vc.videoService.GetVideosByUserId(&pb.GetVideosByUserIdRequest{UserId: uint32(f.FollowedId)})
		if err == nil {
			allVideos = append(allVideos, videos...)
		}
	}

	if len(allVideos) == 0 {
		randomVideos, _ := vc.videoService.GetRecommendedVideos(userId, 0, 0, "", 10)
		for _, v := range randomVideos {
			if !followingIDs[uint64(v.UserID)] {
				allVideos = append(allVideos, *v)
			}
		}
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

		p := vc.modelToProto(ctx, &v)
		p.User = &pb.User{Id: user.Id, Username: user.Username, Avatar: user.Avatar}
		pbVideos = append(pbVideos, p)
	}

	return &pb.GetVideosByUserIdResponse{Videos: pbVideos, Total: int32(len(pbVideos))}, nil
}

func (vc *VideoController) fetchVideoAttributes(
    ctx context.Context, 
    videoId uint32, 
    userId uint32,
) (uint64, uint64, uint64, bool, *userpb.User, error) {
    // Fetch Likes Count
    likeResp, err := vc.likeClient.GetVideoLikeCount(ctx, &likepb.GetVideoLikeCountRequest{VideoId: videoId})
    if err != nil || likeResp == nil {
        return 0, 0, 0, false, nil, fmt.Errorf("failed to get like count: %v", err)
    }

	// Fetch Views Count from the video service (assuming it exists)
	if _, err := vc.videoService.GetVideoByID(uint(videoId)); err != nil {
		return 0, 0, 0, false, nil, fmt.Errorf("failed to get video details: %v", err)
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
    if userId != 0 {
        likeResp, err := vc.likeClient.IsLiked(ctx, &likepb.IsLikedRequest{
            UserId:  userId,
            VideoId: videoId,
        })
        if err != nil || likeResp == nil {
            isLiked = false
        } else {
            isLiked = likeResp.Liked
        }
    }

    // Fetch user info if available
    var user *userpb.User
    if userId != 0 {
        user, err = vc.userClient.GetUserById(ctx, &userpb.GetUserByIdRequest{Id: uint64(userId)})
        if err != nil {
            return 0, 0, 0, false, nil, fmt.Errorf("failed to fetch user info: %v", err)
        }
    }

	return likeResp.Count, commentsCount, viewsCount, isLiked, user, nil
}

