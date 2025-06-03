package repository

import "github.com/KennedySurianto/tpa_web/backend/activity-service/internal/model"

type LikeCommentRepository interface {
	AddLikeComment(like *model.LikeComment) error
	RemoveLikeComment(like *model.LikeComment) error
	IsCommentLiked(userID, commentId uint) (bool, error)
	GetLikeCount(commentID uint) (int64, error)
}