package service

import (
	"context"
	"fmt"
	"time"

	pb "github.com/KennedySurianto/tpa_web/backend/shared/gen/video"
	"github.com/KennedySurianto/tpa_web/backend/video-service/internal/model"
	"github.com/KennedySurianto/tpa_web/backend/video-service/internal/repository"
	"github.com/KennedySurianto/tpa_web/backend/video-service/internal/storage"
)

type VideoServiceImpl struct {
	videoRepo repository.VideoRepository
	minio *storage.MinIOClient
}

func NewVideoService(videoRepo repository.VideoRepository, minio *storage.MinIOClient) *VideoServiceImpl {
	return &VideoServiceImpl{
		videoRepo: 	videoRepo,
		minio: 		minio,
	}
}

func (s *VideoServiceImpl) CreateVideo(req *pb.CreateVideoRequest) (*model.Video, error) {
	var videoURL string

	fmt.Println("[VIDEO_SERVICE_IMPL] Received CreateVideoRequest:", req.Caption, " ", req.Description, " ", req.AllowComments)
	if len(req.VideoData) > 0 && req.ContentType != "" {
		// generate a filename, e.g. user_5_caption.mp4
		fileName := fmt.Sprintf("user_%d_%d.mp4", req.UserId, time.Now().Unix())

		fmt.Println("[VIDEO_SERVICE_IMPL] Uploading video with filename:", fileName)
		uploadedURL, err := s.minio.UploadVideo(context.Background(), fileName, req.VideoData, req.ContentType)
		if err != nil {
			return nil, fmt.Errorf("failed to upload video to MinIO: %w", err)
		}

		fmt.Println("[VIDEO_SERVICE_IMPL] Video uploaded successfully, URL:", uploadedURL)
		videoURL = uploadedURL
	} else {
		// fallback if no file is provided
		videoURL = req.VideoUrl
	}

	video := &model.Video{
		UserID:        uint(req.UserId),
		VideoURL:      videoURL,
		ThumbnailURL:  req.ThumbnailUrl,
		Caption:       req.Caption,
		Description:   stringPtrToString(req.Description),
		Duration:      int(req.Duration),
		SoundID:       uint32PtrToUintPtr(req.SoundId),
		Privacy:       req.Privacy,
		AllowComments: req.AllowComments,
		AllowDuet:     req.AllowDuet,
		AllowStitch:   req.AllowStitch,
	}

	fmt.Println("[VIDEO_SERVICE_IMPL] MODEL ALLOWCOMMENTS: ", video.AllowComments)

	if err := s.videoRepo.CreateVideo(video); err != nil {
		return nil, err
	}

	fmt.Println("[VIDEO_SERVICE_IMPL] Video created successfully with ID:", video.ID)
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
	return s.videoRepo.ListVideos(uint(req.UserId), int(req.Page), int(req.Limit))
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

// stringPtrToString safely dereferences a *string, returning an empty string if nil.
func stringPtrToString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func (s *VideoServiceImpl) GetRecommendedVideos(userID, lastVideoID, deviceID uint32, language string, limit int32) ([]*model.Video, error) {
	// business logic can go here (e.g. ML fallback or filtering)
	return s.videoRepo.GetRecommendedVideos(userID, lastVideoID, deviceID, language, limit)
}