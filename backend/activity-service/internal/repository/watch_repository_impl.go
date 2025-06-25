package repository

import (
	"github.com/KennedySurianto/tpa_web/backend/activity-service/internal/model"
	"gorm.io/gorm"
)

type WatchRepositoryImpl struct {
	db *gorm.DB
}

func NewWatchRepository(db *gorm.DB) WatchRepository {
	return &WatchRepositoryImpl{
		db: db,
	}
}

func (r *WatchRepositoryImpl) AddWatch(watch *model.Watch) error {
	return r.db.Create(watch).Error
}

func (r *WatchRepositoryImpl) RemoveWatch(watch *model.Watch) error {
	return r.db.Delete(watch).Error
}

func (r *WatchRepositoryImpl) IsWatched(userID, videoID uint) (bool, error) {
	var watch model.Watch
	err := r.db.First(&watch, "user_id = ? AND video_id = ?", userID, videoID).Error
	if err == gorm.ErrRecordNotFound {
		return false, nil
	}
	return err == nil, err
}

func (s *WatchRepositoryImpl) GetViewCount(videoID uint) (int64, error) {
	var count int64
	err := s.db.Model(&model.Watch{}).Where("video_id = ?", videoID).Count(&count).Error
	return count, err
}

