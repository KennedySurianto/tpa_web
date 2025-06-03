package service

type LikeService interface {
	Like(userID, videoID uint) error
	Unlike(userID, videoID uint) error
	IsLiked(userID, videoID uint) (bool, error)
	GetLikeCount(videoID uint) (int64, error)
}
