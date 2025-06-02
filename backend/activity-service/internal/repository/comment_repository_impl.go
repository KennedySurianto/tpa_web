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
	err := r.db.WithContext(ctx).Where("video_id = ?", videoID).Order("created_at DESC").Find(&comments).Error
	return comments, err
}

func (r *CommentRepositoryImpl) CreateComment(ctx context.Context, comment *model.Comment) error {
    return r.db.WithContext(ctx).Create(comment).Error
}