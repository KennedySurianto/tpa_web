package repository

import (
	"github.com/KennedySurianto/tpa_web/backend/video-service/internal/model"
	"gorm.io/gorm"
)

type VideoRepository interface {
	CreateVideo(video *model.Video) error
	GetVideoByID(id uint) (*model.Video, error)
	UpdateVideo(video *model.Video) error
	DeleteVideo(id uint) error
	GetVideosByUserId(userID uint) ([]model.Video, error)
	GetRecommendedVideos(userID, lastVideoID, deviceID uint32, language string, limit int32) ([]*model.Video, error)
	GetRandomPublicVideos(limit, userID uint32) ([]*model.Video, error)
	SaveCaption(caption *model.Caption) error
	GetCaptionsByVideoID(videoID uint) ([]model.Caption, error)
	BeginTx() *gorm.DB
	CreateVideoTx(tx *gorm.DB, video *model.Video) error
	SaveCaptionTx(tx *gorm.DB, caption *model.Caption) error
	GetAllVideos() ([]model.Video, error)
	GetVideosByIDs(ids []uint) ([]*model.Video, error)
	GetVideosByUserIDs(userIDs []uint32) ([]model.Video, error)
}
