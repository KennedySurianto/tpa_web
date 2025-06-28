package repository

import "github.com/KennedySurianto/tpa_web/backend/activity-service/internal/model"

type LikeRepository interface {
	AddLike(like *model.Like) error
	RemoveLike(like *model.Like) error
	IsLiked(userID, videoID uint) (bool, error)
	GetLikeCount(videoID uint) (int64, error)
	GetLikesByUserId(userID uint) ([]model.Like, error)
}