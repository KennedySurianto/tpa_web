package service

type LikeService interface {
	Like(userID, videoID uint) error
	Unlike(userID, videoID uint) error
	IsLiked(userID, videoID uint) (bool, error)
}
