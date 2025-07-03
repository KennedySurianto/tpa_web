package service

import (
	"context"

	pb "github.com/KennedySurianto/tpa_web/backend/shared/gen/video"
	"github.com/KennedySurianto/tpa_web/backend/video-service/internal/model"
)

type VideoService interface {
	CreateVideo(req *pb.CreateVideoRequest) (*model.Video, error)
	GetVideoByID(id uint) (*model.Video, error)
	UpdateVideo(req *pb.UpdateVideoRequest) (*model.Video, error)
	DeleteVideo(id uint) error
	GetVideosByUserId(req *pb.GetVideosByUserIdRequest) ([]model.Video, error)
	GetRecommendedVideos(userID, lastVideoID, deviceID uint32, language string, limit int32) ([]*model.Video, error)
	GetCaptionsByVideoID(videoID uint) ([]model.Caption, error)
	GetAllVideos() ([]model.Video, error)
	GetLikedVideosByUserId(userId uint32) ([]*model.Video, error)

	// ads
	GetRandomAd(ctx context.Context) (*model.Video, error)
}
