package service

import "github.com/KennedySurianto/tpa_web/backend/activity-service/internal/model"

type FollowService interface {
	FollowUser(followerID, followedID uint) error
	UnfollowUser(followerID, followedID uint) error
	GetFollowers(userID uint) ([]model.Follow, error)
	GetFollowing(userID uint) ([]model.Follow, error)
	GetFriends(userID uint, page int32, limit int32) ([]model.Follow, bool, error)
}