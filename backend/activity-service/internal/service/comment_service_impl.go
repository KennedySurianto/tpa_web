package service

import (
	"context"

	"github.com/KennedySurianto/tpa_web/backend/activity-service/internal/model"
	"github.com/KennedySurianto/tpa_web/backend/activity-service/internal/repository"
)

type commentService struct {
	repo repository.CommentRepository
}

func NewCommentService(repo repository.CommentRepository) CommentService {
	return &commentService{repo: repo}
}

func (s *commentService) GetComments(ctx context.Context, videoID uint) ([]model.Comment, error) {
	return s.repo.GetCommentsByVideoID(ctx, videoID)
}

func (s *commentService) CreateComment(ctx context.Context, userID, videoID uint64, content string) (*model.Comment, error) {
    comment := &model.Comment{
        UserID:    uint(userID),
        VideoID:   uint(videoID),
        Content:   content,
    }

    if err := s.repo.CreateComment(ctx, comment); err != nil {
        return nil, err
    }

    return comment, nil
}