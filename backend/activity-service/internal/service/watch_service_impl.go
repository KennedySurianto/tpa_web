package service

import (
	"github.com/KennedySurianto/tpa_web/backend/activity-service/internal/model"
	"github.com/KennedySurianto/tpa_web/backend/activity-service/internal/repository"
)

type watchServiceImpl struct {
	repo repository.WatchRepository
}

func NewWatchService(repo repository.WatchRepository) WatchService {
	return &watchServiceImpl{repo}
}

func (s *watchServiceImpl) Watch(userID, videoID uint) error {
	return s.repo.AddWatch(&model.Watch{UserID: userID, VideoID: videoID})
}

func (s *watchServiceImpl) Unwatch(userID, videoID uint) error {
	return s.repo.RemoveWatch(&model.Watch{UserID: userID, VideoID: videoID})
}

func (s *watchServiceImpl) IsWatched(userID, videoID uint) (bool, error) {
	return s.repo.IsWatched(userID, videoID)
}

func (s *watchServiceImpl) GetViewCount(videoID uint) (int64, error) {
	return s.repo.GetViewCount(videoID)
}
