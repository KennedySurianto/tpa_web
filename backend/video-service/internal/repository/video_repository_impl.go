package repository

import (
	"errors"

	"github.com/KennedySurianto/tpa_web/backend/video-service/internal/model"
	"gorm.io/gorm"
)

type VideoRepositoryImpl struct {
	db *gorm.DB
}

func NewVideoRepository(db *gorm.DB) *VideoRepositoryImpl {
	return &VideoRepositoryImpl{db: db}
}

func (r *VideoRepositoryImpl) CreateVideo(video *model.Video) error {
	return r.db.Create(video).Error
}

func (r *VideoRepositoryImpl) GetVideoByID(id uint) (*model.Video, error) {
	var video model.Video
	err := r.db.First(&video, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	return &video, err
}

func (r *VideoRepositoryImpl) UpdateVideo(video *model.Video) error {
	return r.db.Save(video).Error
}

func (r *VideoRepositoryImpl) DeleteVideo(id uint) error {
	return r.db.Delete(&model.Video{}, id).Error
}

func (r *VideoRepositoryImpl) ListVideos(userID uint, page, limit int) ([]model.Video, int64, error) {
	var videos []model.Video
	var count int64

	query := r.db.Model(&model.Video{}).Where("user_id = ?", userID)

	err := query.Count(&count).Offset((page - 1) * limit).Limit(limit).Find(&videos).Error
	return videos, count, err
}

func (r *VideoRepositoryImpl) UpdateMetrics(id uint, views, likes, comments *uint) (*model.Video, error) {
	updates := map[string]interface{}{}
	if views != nil {
		updates["views_count"] = *views
	}
	if likes != nil {
		updates["likes_count"] = *likes
	}
	if comments != nil {
		updates["comments_count"] = *comments
	}
	if err := r.db.Model(&model.Video{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		return nil, err
	}
	return r.GetVideoByID(id)
}
