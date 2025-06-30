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

func (r *FollowRepositoryImpl) GetFriends(userID uint, page int32, limit int32) ([]model.Follow, bool, error) {
    followers, err := r.GetFollowers(userID)
    if err != nil {
        return nil, false, err
    }

    following, err := r.GetFollowing(userID)
    if err != nil {
        return nil, false, err
    }

    // Find mutual friends between followers and following
    var friends []model.Follow
    followingMap := make(map[uint]struct{})
    for _, follow := range following {
        followingMap[follow.FollowedID] = struct{}{}
    }

    for _, follow := range followers {
        if _, found := followingMap[follow.FollowerID]; found {
            friends = append(friends, follow)
        }
    }

    // Pagination logic
    start := int(page-1) * int(limit)
    end := start + int(limit)
    if end > len(friends) {
        end = len(friends)
    }

    hasMore := end < len(friends)

    return friends[start:end], hasMore, nil
}
