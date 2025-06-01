package service

import (
	"context"

	"github.com/KennedySurianto/tpa_web/backend/activity-service/internal/model"
)

type CommentService interface {
	GetComments(ctx context.Context, videoID uint) ([]model.Comment, error)
	CreateComment(ctx context.Context, userID, videoID uint64, content string) (*model.Comment, error)
}