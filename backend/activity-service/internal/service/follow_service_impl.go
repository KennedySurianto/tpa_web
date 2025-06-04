package service

import (
	"github.com/KennedySurianto/tpa_web/backend/activity-service/internal/model"
	"github.com/KennedySurianto/tpa_web/backend/activity-service/internal/repository"
)

type FollowServiceImpl struct {
	repo repository.FollowRepository
}

func NewFollowService(repo repository.FollowRepository) FollowService {
	return &FollowServiceImpl{repo}
}

func (s *FollowServiceImpl) FollowUser(followerID, followedID uint) error {
	return s.repo.Follow(&model.Follow{FollowerID: followerID, FollowedID: followedID})
}

func (s *FollowServiceImpl) UnfollowUser(followerID, followedID uint) error {
	return s.repo.Unfollow(&model.Follow{FollowerID: followerID, FollowedID: followedID})
}

func (s *FollowServiceImpl) GetFollowers(userID uint) ([]model.Follow, error) {
	return s.repo.GetFollowers(userID)
}

func (s *FollowServiceImpl) GetFollowing(userID uint) ([]model.Follow, error) {
	return s.repo.GetFollowing(userID)
}