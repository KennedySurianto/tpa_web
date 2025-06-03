package service

type LikeCommentService interface {
	LikeComment(userID, commentID uint) error
	UnlikeComment(userID, commentID uint) error
	IsCommentLiked(userID, commentID uint) (bool, error)
	GetLikeCount(commentID uint) (int64, error)
}
