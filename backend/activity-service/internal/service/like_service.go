package service

import "github.com/KennedySurianto/tpa_web/backend/activity-service/internal/model"

type LikeService interface {
	Like(userID, videoID uint) error
	Unlike(userID, videoID uint) error
	IsLiked(userID, videoID uint) (bool, error)
	GetLikeCount(videoID uint) (int64, error)
	GetLikesByUserId(userID uint) ([]model.Like, error)
}
