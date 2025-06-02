package service

import (
	"context"
	"fmt"

	"github.com/KennedySurianto/tpa_web/backend/activity-service/internal/model"
	"github.com/KennedySurianto/tpa_web/backend/activity-service/internal/repository"
)

type CommentServiceImpl struct {
	repo repository.CommentRepository
}

func NewCommentService(repo repository.CommentRepository) CommentService {
	return &CommentServiceImpl{repo: repo}
}

func (s *CommentServiceImpl) GetComments(ctx context.Context, videoID uint) ([]model.Comment, error) {
	return s.repo.GetCommentsByVideoID(ctx, videoID)
}

func (s *CommentServiceImpl) CreateComment(ctx context.Context, userID, videoID uint64, content string) (*model.Comment, error) {
    comment := &model.Comment{
        UserID:    uint(userID),
        VideoID:   uint(videoID),
        Content:   content,
    }

    fmt.Println("[COMMENT SERVICE_IMPL] Creating comment:", comment)
    if err := s.repo.CreateComment(ctx, comment); err != nil {
        return nil, err
    }
    fmt.Println("[COMMENT SERVICE_IMPL] Created comment:", comment)

    return comment, nil
}