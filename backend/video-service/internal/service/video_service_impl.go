package service

import (
	pb "github.com/KennedySurianto/tpa_web/backend/shared/gen/video"
	"github.com/KennedySurianto/tpa_web/backend/video-service/internal/model"
	"github.com/KennedySurianto/tpa_web/backend/video-service/internal/repository"
)

type VideoServiceImpl struct {
	videoRepo repository.VideoRepository
}

func NewVideoService(videoRepo repository.VideoRepository) *VideoServiceImpl {
	return &VideoServiceImpl{videoRepo: videoRepo}
}

func (s *VideoServiceImpl) CreateVideo(req *pb.CreateVideoRequest) (*model.Video, error) {
	video := &model.Video{
		UserID:        uint(req.UserId),
		VideoURL:      req.VideoUrl,
		ThumbnailURL:  req.ThumbnailUrl,
		Caption:       req.Caption,
		Duration:      int(req.Duration),
		SoundID:       uint32PtrToUintPtr(req.SoundId),
		Privacy:       req.Privacy,
		AllowComments: req.AllowComments,
		AllowDuet:     req.AllowDuet,
		AllowStitch:   req.AllowStitch,
	}
	if err := s.videoRepo.CreateVideo(video); err != nil {
		return nil, err
	}
	return video, nil
}

func (s *VideoServiceImpl) GetVideoByID(id uint) (*model.Video, error) {
	return s.videoRepo.GetVideoByID(id)
}

func (s *VideoServiceImpl) UpdateVideo(req *pb.UpdateVideoRequest) (*model.Video, error) {
	video, err := s.videoRepo.GetVideoByID(uint(req.Id))
	if err != nil {
		return nil, err
	}

	if req.ThumbnailUrl != nil {
		video.ThumbnailURL = *req.ThumbnailUrl
	}
	if req.Caption != nil {
		video.Caption = *req.Caption
	}
	if req.Privacy != nil {
		video.Privacy = *req.Privacy
	}
	if req.AllowComments != nil {
		video.AllowComments = *req.AllowComments
	}
	if req.AllowDuet != nil {
		video.AllowDuet = *req.AllowDuet
	}
	if req.AllowStitch != nil {
		video.AllowStitch = *req.AllowStitch
	}

	err = s.videoRepo.UpdateVideo(video)
	return video, err
}

func (s *VideoServiceImpl) DeleteVideo(id uint) error {
	return s.videoRepo.DeleteVideo(id)
}

func (s *VideoServiceImpl) ListVideos(req *pb.ListVideosRequest) ([]model.Video, int64, error) {
	return s.videoRepo.ListVideos(uint(req.UserId), req.Privacy, int(req.Page), int(req.Limit))
}

func (s *VideoServiceImpl) UpdateMetrics(req *pb.UpdateMetricsRequest) (*model.Video, error) {
	return s.videoRepo.UpdateMetrics(
		uint(req.Id), 
		uint32PtrToUintPtr(req.ViewsCount), 
		uint32PtrToUintPtr(req.LikesCount), 
		uint32PtrToUintPtr(req.CommentsCount),
	)
}

// uint32PtrToUintPtr converts a *uint32 to a *uint.
func uint32PtrToUintPtr(u *uint32) *uint {
	if u == nil {
		return nil
	}
	val := uint(*u)
	return &val
}
