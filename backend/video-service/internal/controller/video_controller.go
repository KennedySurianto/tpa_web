package controller

import (
	"context"
	"fmt"
	"sort"

	"google.golang.org/protobuf/types/known/timestamppb"

	followpb "github.com/KennedySurianto/tpa_web/backend/shared/gen/follow"
	likepb "github.com/KennedySurianto/tpa_web/backend/shared/gen/like"
	userpb "github.com/KennedySurianto/tpa_web/backend/shared/gen/user"
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
}

func NewVideoController(
	videoService service.VideoService, 
	userClient userpb.UserServiceClient, 
	likeClient likepb.LikeServiceClient,
	followClient followpb.FollowServiceClient) *VideoController {
	return &VideoController{
		videoService: videoService,
		userClient:   userClient,
		likeClient:   likeClient,
		followClient: followClient,
	}
}

func (s *VideoController) modelToProto(video *model.Video) *pb.Video {
	pbVideo := &pb.Video{
		Id:            uint32(video.ID),
		UserId:        uint32(video.UserID),
		VideoUrl:      video.VideoURL,
		ThumbnailUrl:  video.ThumbnailURL,
		Caption:       video.Caption,
		Duration:      int32(video.Duration),
		Privacy:       video.Privacy,
		ViewsCount:    uint32(video.ViewsCount),
		LikesCount:    uint32(video.LikesCount),
		CommentsCount: uint32(video.CommentsCount),
		AllowComments: video.AllowComments,
		AllowDuet:     video.AllowDuet,
		AllowStitch:   video.AllowStitch,
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
		Video: s.modelToProto(video),
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
		Video: s.modelToProto(video),
	}, nil
}

func (s *VideoController) UpdateVideo(ctx context.Context, req *pb.UpdateVideoRequest) (*pb.UpdateVideoResponse, error) {
	updateReq := &pb.UpdateVideoRequest{}

	if req.ThumbnailUrl != nil {
		updateReq.ThumbnailUrl = req.ThumbnailUrl
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
		Video: s.modelToProto(video),
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
		pbVideos[i] = s.modelToProto(&video)
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
		Video: s.modelToProto(video),
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
		var soundId *uint32
		if v.SoundID != nil {
			sid := uint32(*v.SoundID)
			soundId = &sid
		}

		user, err := vc.userClient.GetUserById(ctx, &userpb.GetUserByIdRequest{Id: uint64(v.UserID)})
        if err != nil {
            // Handle error, maybe skip user or fill with default data
            // For now, let's just log and continue with empty user
            fmt.Printf("Error fetching user %d: %v\n", v.UserID, err)
			user = &userpb.User{
				Id:        0,
				Username:  "Unknown",
				Avatar: nil,
			}
        }

		response.Videos = append(response.Videos, &pb.Video{
			Id:           uint32(v.ID),
			CreatedAt:    timestamppb.New(v.CreatedAt),
			UpdatedAt:    timestamppb.New(v.UpdatedAt),
			DeletedAt:    timestamppb.New(v.DeletedAt.Time),

			UserId:       uint32(v.UserID),
			VideoUrl:     v.VideoURL,
			ThumbnailUrl: v.ThumbnailURL,
			Caption:      v.Caption,
			Description:  &v.Description,
			Duration:     int32(v.Duration),

			SoundId:      soundId,
			Privacy:      v.Privacy,

			ViewsCount:    uint32(v.ViewsCount),
			LikesCount:    uint32(v.LikesCount),
			CommentsCount: uint32(v.CommentsCount),

			AllowComments: v.AllowComments,
			AllowDuet:     v.AllowDuet,
			AllowStitch:   v.AllowStitch,

			User: &pb.User{
				Id:        uint64(user.Id),
				Username:  user.Username,
				Avatar: user.Avatar,
			},

			IsLiked: func() bool {
				if req.UserId == 0 {
					return false
				}
				resp, err := vc.likeClient.IsLiked(ctx, &likepb.IsLikedRequest{
					UserId: req.UserId,
					VideoId: uint32(v.ID),
				})
				if err != nil || resp == nil {
					return false
				}
				return resp.Liked
			}(),

			LikeCount: func() uint64 {
				resp, err := vc.likeClient.GetVideoLikeCount(ctx, &likepb.GetVideoLikeCountRequest{VideoId: uint32(v.ID)})
				if err != nil || resp == nil {
					return 0
				}
				return resp.Count
			}(),
		})
	}
	return &response, nil
}

func (vc *VideoController) GetFriendVideos(ctx context.Context, req *pb.GetVideosByUserIdRequest) (*pb.GetVideosByUserIdResponse, error) {
	userId := req.UserId

	// Step 1: Get followers
	followersResp, err := vc.followClient.GetFollowers(ctx, &followpb.UserRequest{UserId: userId})
	if err != nil {
		return nil, fmt.Errorf("failed to get followers: %w", err)
	}

	// Step 2: Get following
	followingResp, err := vc.followClient.GetFollowing(ctx, &followpb.UserRequest{UserId: userId})
	if err != nil {
		return nil, fmt.Errorf("failed to get following: %w", err)
	}

	// Step 3: Identify mutual friends
	followerMap := make(map[uint64]bool)
	for _, f := range followersResp.Follows {
		followerMap[uint64(f.FollowerId)] = true
	}

	var friendIds []uint64
	for _, f := range followingResp.Follows {
		if followerMap[uint64(f.FollowedId)] {
			friendIds = append(friendIds, uint64(f.FollowedId))
		}
	}

	// Step 4: Fetch all friend videos
	var allVideos []model.Video
	friendUserMap := make(map[uint64]*userpb.User) // cache users

	for _, friendID := range friendIds {
		// Fetch videos
		videos, _, err := vc.videoService.GetVideosByUserId(&pb.GetVideosByUserIdRequest{
			UserId: uint32(friendID),
		})
		if err != nil {
			continue
		}
		allVideos = append(allVideos, videos...)

		// Fetch user metadata
		if _, exists := friendUserMap[friendID]; !exists {
			userResp, err := vc.userClient.GetUserById(ctx, &userpb.GetUserByIdRequest{Id: friendID})
			if err != nil {
				friendUserMap[friendID] = &userpb.User{
					Id:       friendID,
					Username: "Unknown",
					Avatar:   nil,
				}
			} else {
				friendUserMap[friendID] = userResp
			}
		}
	}

	// Step 5: Sort by creation time
	sort.Slice(allVideos, func(i, j int) bool {
		return allVideos[i].CreatedAt.After(allVideos[j].CreatedAt)
	})

	// Step 6: Convert to proto
	var pbVideos []*pb.Video
	for _, v := range allVideos {
		p := vc.modelToProto(&v)

		if user, ok := friendUserMap[uint64(v.UserID)]; ok {
			p.User = &pb.User{
				Id:       user.Id,
				Username: user.Username,
				Avatar:   user.Avatar,
			}
		}

		pbVideos = append(pbVideos, p)
	}

	return &pb.GetVideosByUserIdResponse{
		Videos: pbVideos,
		Total:  int32(len(pbVideos)),
	}, nil
}

