package service

import (
	pb "github.com/KennedySurianto/tpa_web/backend/shared/gen/video"
	"github.com/KennedySurianto/tpa_web/backend/video-service/internal/model"
)

type VideoService interface {
	CreateVideo(req *pb.CreateVideoRequest) (*model.Video, error)
	GetVideoByID(id uint) (*model.Video, error)
	UpdateVideo(req *pb.UpdateVideoRequest) (*model.Video, error)
	DeleteVideo(id uint) error
	ListVideos(req *pb.ListVideosRequest) ([]model.Video, int64, error)
	UpdateMetrics(req *pb.UpdateMetricsRequest) (*model.Video, error)
	GetRecommendedVideos(userID, lastVideoID, deviceID, language string, limit int32) ([]*model.Video, error)
}
