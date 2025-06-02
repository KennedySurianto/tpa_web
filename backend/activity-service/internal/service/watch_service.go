package service

type WatchService interface {
	Watch(userID, videoID uint) error
	Unwatch(userID, videoID uint) error
	IsWatched(userID, videoID uint) (bool, error)
}
