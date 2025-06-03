package service

import (
	"github.com/KennedySurianto/tpa_web/backend/activity-service/internal/model"
	"github.com/KennedySurianto/tpa_web/backend/activity-service/internal/repository"
)

type LikeCommentServiceImpl struct {
	repo repository.LikeCommentRepository
}

func NewLikeCommentService(repo repository.LikeCommentRepository) LikeCommentService {
	return &LikeCommentServiceImpl{repo}
}

func (s *LikeCommentServiceImpl) LikeComment(userID, commentID uint) error {
	return s.repo.AddLikeComment(&model.LikeComment{UserID: userID, CommentID: commentID})
}

func (s *LikeCommentServiceImpl) UnlikeComment(userID, commentID uint) error {
	return s.repo.RemoveLikeComment(&model.LikeComment{UserID: userID, CommentID: commentID})
}

func (s *LikeCommentServiceImpl) IsCommentLiked(userID, commentID uint) (bool, error) {
	return s.repo.IsCommentLiked(userID, commentID)
}

func (s *LikeCommentServiceImpl) GetLikeCount(commentID uint) (int64, error) {
	return s.repo.GetLikeCount(commentID)
}
