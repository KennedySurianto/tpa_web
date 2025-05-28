package controller

import (
	"context"

	"google.golang.org/protobuf/types/known/timestamppb"

	pb "github.com/KennedySurianto/tpa_web/backend/shared/gen/video"
	"github.com/KennedySurianto/tpa_web/backend/video-service/internal/model"
	"github.com/KennedySurianto/tpa_web/backend/video-service/internal/service"
)

type VideoController struct {
	pb.UnimplementedVideoServiceServer
	videoService service.VideoService
}

func NewVideoController(videoService service.VideoService) *VideoController {
	return &VideoController{
		videoService: videoService,
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
	createReq := &pb.CreateVideoRequest{
		UserId:        req.UserId,
		VideoUrl:      req.VideoUrl,
		ThumbnailUrl:  req.ThumbnailUrl,
		Caption:       req.Caption,
		Duration:      req.Duration,
		Privacy:       req.Privacy,
		AllowComments: req.AllowComments,
		AllowDuet:     req.AllowDuet,
		AllowStitch:   req.AllowStitch,
	}

	if req.SoundId != nil {
		sid := uint32(*req.SoundId)
		createReq.SoundId = &sid
	}

	video, err := s.videoService.CreateVideo(createReq)
	if err != nil {
		return nil, err
	}

	return &pb.CreateVideoResponse{
		Video: s.modelToProto(video),
	}, nil
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

func (s *VideoController) ListVideos(ctx context.Context, req *pb.ListVideosRequest) (*pb.ListVideosResponse, error) {
	req = &pb.ListVideosRequest{
		UserId:  req.UserId,
		Page:    req.Page,
		Limit:   req.Limit,
		Privacy: req.Privacy,
	}

	if req.Page <= 0 {
		req.Page = 1
	}
	if req.Limit <= 0 {
		req.Limit = 20
	}

	videos, total, err := s.videoService.ListVideos(req)
	if err != nil {
		return nil, err
	}

	pbVideos := make([]*pb.Video, len(videos))
	for i, video := range videos {
		pbVideos[i] = s.modelToProto(&video)
	}

	return &pb.ListVideosResponse{
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
