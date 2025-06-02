package service

import (
	"github.com/KennedySurianto/tpa_web/backend/activity-service/internal/model"
	"github.com/KennedySurianto/tpa_web/backend/activity-service/internal/repository"
)

type likeServiceImpl struct {
	repo repository.LikeRepository
}

func NewLikeService(repo repository.LikeRepository) LikeService {
	return &likeServiceImpl{repo}
}

func (s *likeServiceImpl) Like(userID, videoID uint) error {
	return s.repo.AddLike(&model.Like{UserID: userID, VideoID: videoID})
}

func (s *likeServiceImpl) Unlike(userID, videoID uint) error {
	return s.repo.RemoveLike(&model.Like{UserID: userID, VideoID: videoID})
}

func (s *likeServiceImpl) IsLiked(userID, videoID uint) (bool, error) {
	return s.repo.IsLiked(userID, videoID)
}
