package repository

import (
	"github.com/KennedySurianto/tpa_web/backend/activity-service/internal/model"
	"gorm.io/gorm"
)

type LikeCommentRepositoryImpl struct {
	db *gorm.DB
}

func NewLikeCommentRepository(db *gorm.DB) LikeCommentRepository {
	return &LikeCommentRepositoryImpl{
		db: db,
	}
}

func (r *LikeCommentRepositoryImpl) AddLikeComment(likeComment *model.LikeComment) error {
	return r.db.Create(likeComment).Error
}

func (r *LikeCommentRepositoryImpl) RemoveLikeComment(likeComment *model.LikeComment) error {
	return r.db.Delete(likeComment).Error
}

func (r *LikeCommentRepositoryImpl) IsCommentLiked(userID, videoID uint) (bool, error) {
	var like model.LikeComment
	err := r.db.First(&like, "user_id = ? AND comment_id = ?", userID, videoID).Error
	if err == gorm.ErrRecordNotFound {
		return false, nil
	}
	return err == nil, err
}

func (r *LikeCommentRepositoryImpl) GetLikeCount(commentID uint) (int64, error) {
	var count int64
	err := r.db.Model(&model.LikeComment{}).
		Where("comment_id = ?", commentID).
		Count(&count).Error
	return count, err
}
