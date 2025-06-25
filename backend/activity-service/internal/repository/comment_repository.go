package repository

import (
	"context"

	"github.com/KennedySurianto/tpa_web/backend/activity-service/internal/model"
)

type CommentRepository interface {
	GetCommentsByVideoID(ctx context.Context, videoID uint) ([]model.Comment, error)
	CreateComment(ctx context.Context, comment *model.Comment) error
	GetRepliesByCommentID(ctx context.Context, commentID uint) ([]model.Comment, error)
	GetCommentCount(videoID uint) (int64, error)
}