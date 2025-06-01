package repository

import (
	"context"

	"github.com/KennedySurianto/tpa_web/backend/activity-service/internal/model"
	"gorm.io/gorm"
)

type commentRepository struct {
	db *gorm.DB
}

func NewCommentRepository(db *gorm.DB) CommentRepository {
	return &commentRepository{db: db}
}

func (r *commentRepository) GetCommentsByVideoID(ctx context.Context, videoID uint) ([]model.Comment, error) {
	var comments []model.Comment
	err := r.db.WithContext(ctx).Where("video_id = ?", videoID).Order("created_at ASC").Find(&comments).Error
	return comments, err
}

func (r *commentRepository) CreateComment(ctx context.Context, comment *model.Comment) error {
    return r.db.WithContext(ctx).Create(comment).Error
}