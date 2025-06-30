package repository

import "github.com/KennedySurianto/tpa_web/backend/activity-service/internal/model"

type FollowRepository interface {
	Follow(follow *model.Follow) error
	Unfollow(follow *model.Follow) error
	GetFollowers(userID uint) ([]model.Follow, error)
	GetFollowing(userID uint) ([]model.Follow, error)
	GetFriends(userID uint, page int32, limit int32) ([]model.Follow, bool, error)
}