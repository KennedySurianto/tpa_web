package service

import (
	"context"

	"github.com/KennedySurianto/tpa_web/backend/activity-service/internal/model"
)

type CommentService interface {
	GetComments(ctx context.Context, videoID uint) ([]model.Comment, error)
	CreateComment(ctx context.Context, userID, videoID, replyToId uint64, content string) (*model.Comment, error)
	GetReplies(ctx context.Context, commentID uint) ([]model.Comment, error)
	GetCommentCount(videoID uint) (int64, error)
}