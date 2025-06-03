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

func (s *CommentServiceImpl) CreateComment(ctx context.Context, userID, videoID, replyToId uint64, content string) (*model.Comment, error) {
    var comment *model.Comment

    var replyToIDPtr *uint
    if replyToId != 0 {
        temp := uint(replyToId)
        replyToIDPtr = &temp
    }

    comment = &model.Comment{
        UserID:    uint(userID),
        VideoID:   uint(videoID),
        Content:   content,
        ReplyToID: replyToIDPtr,
    }

    fmt.Println("[COMMENT SERVICE_IMPL] Creating comment:", comment)
    if err := s.repo.CreateComment(ctx, comment); err != nil {
        return nil, err
    }
    fmt.Println("[COMMENT SERVICE_IMPL] Created comment:", comment)

    return comment, nil
}

func (s *CommentServiceImpl) GetReplies(ctx context.Context, commentID uint) ([]model.Comment, error) {
    return s.repo.GetRepliesByCommentID(ctx, commentID)
}