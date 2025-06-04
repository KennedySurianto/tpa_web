package repository

import (
	"github.com/KennedySurianto/tpa_web/backend/activity-service/internal/model"
	"gorm.io/gorm"
)

type FollowRepositoryImpl struct {
	db *gorm.DB
}

func NewFollowRepository(db *gorm.DB) FollowRepository {
	return &FollowRepositoryImpl{db}
}

func (r *FollowRepositoryImpl) Follow(follow *model.Follow) error {
	return r.db.Create(follow).Error
}

func (r *FollowRepositoryImpl) Unfollow(follow *model.Follow) error {
	return r.db.Delete(follow).Error
}

func (r *FollowRepositoryImpl) GetFollowers(userID uint) ([]model.Follow, error) {
	var follows []model.Follow
	err := r.db.Where("followed_id = ?", userID).Find(&follows).Error
	return follows, err
}

func (r *FollowRepositoryImpl) GetFollowing(userID uint) ([]model.Follow, error) {
	var follows []model.Follow
	err := r.db.Where("follower_id = ?", userID).Find(&follows).Error
	return follows, err
}
