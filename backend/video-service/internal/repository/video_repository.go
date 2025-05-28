package repository

import "github.com/KennedySurianto/tpa_web/backend/video-service/internal/model"

type VideoRepository interface {
	CreateVideo(video *model.Video) error
	GetVideoByID(id uint) (*model.Video, error)
	UpdateVideo(video *model.Video) error
	DeleteVideo(id uint) error
	ListVideos(userID uint, privacy string, page, limit int) ([]model.Video, int64, error)
	UpdateMetrics(id uint, views, likes, comments *uint) (*model.Video, error)
}
