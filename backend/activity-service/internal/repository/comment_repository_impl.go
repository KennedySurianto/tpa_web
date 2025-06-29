package repository

import (
	"context"

	"github.com/KennedySurianto/tpa_web/backend/activity-service/internal/model"
	"gorm.io/gorm"
)

type CommentRepositoryImpl struct {
	db *gorm.DB
}

func NewCommentRepository(db *gorm.DB) CommentRepository {
	return &CommentRepositoryImpl{db: db}
}

func (r *CommentRepositoryImpl) GetCommentsByVideoID(ctx context.Context, videoID uint) ([]model.Comment, error) {
	var comments []model.Comment
	err := r.db.WithContext(ctx).
		Where("video_id = ? AND reply_to_id IS NULL", videoID).
		Preload("Replies", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at ASC")
		}).
		Order("created_at DESC").
		Find(&comments).Error
	return comments, err
}

func (r *CommentRepositoryImpl) CreateComment(ctx context.Context, comment *model.Comment) error {
    return r.db.WithContext(ctx).Create(comment).Error
}

func (r *CommentRepositoryImpl) GetRepliesByCommentID(ctx context.Context, commentID uint) ([]model.Comment, error) {
	var replies []model.Comment
	err := r.db.WithContext(ctx).
		Where("reply_to_id = ?", commentID).
		Order("created_at ASC").
		Find(&replies).Error
	return replies, err
}

func (s *CommentRepositoryImpl) GetCommentCount(videoID uint) (int64, error) {
	var count int64
	err := s.db.Model(&model.Comment{}).Where("video_id = ?", videoID).Count(&count).Error
	return count, err
}

func (r *CommentRepositoryImpl) DeleteComment(ctx context.Context, commentID uint) error {
	tx := r.db.WithContext(ctx)

	// Delete replies first
	if err := tx.Where("reply_to_id = ?", commentID).Delete(&model.Comment{}).Error; err != nil {
		return err
	}

	// Then delete the parent comment
	return tx.Delete(&model.Comment{}, commentID).Error
}

