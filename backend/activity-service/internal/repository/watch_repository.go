package repository

import "github.com/KennedySurianto/tpa_web/backend/activity-service/internal/model"

type WatchRepository interface {
	AddWatch(watch *model.Watch) error
	RemoveWatch(watch *model.Watch) error
	IsWatched(userID, videoID uint) (bool, error)
}