package repository

import (
	"github.com/KennedySurianto/tpa_web/backend/activity-service/internal/model"
	"gorm.io/gorm"
)

type LikeRepositoryImpl struct {
	db *gorm.DB
}

func NewLikeRepository(db *gorm.DB) LikeRepository {
	return &LikeRepositoryImpl{
		db: db,
	}
}

func (r *LikeRepositoryImpl) AddLike(like *model.Like) error {
	return r.db.Create(like).Error
}

func (r *LikeRepositoryImpl) RemoveLike(like *model.Like) error {
	return r.db.Delete(like).Error
}

func (r *LikeRepositoryImpl) IsLiked(userID, videoID uint) (bool, error) {
	var like model.Like
	err := r.db.First(&like, "user_id = ? AND video_id = ?", userID, videoID).Error
	if err == gorm.ErrRecordNotFound {
		return false, nil
	}
	return err == nil, err
}