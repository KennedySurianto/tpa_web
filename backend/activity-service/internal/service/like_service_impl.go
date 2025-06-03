package service

import (
	"github.com/KennedySurianto/tpa_web/backend/activity-service/internal/model"
	"github.com/KennedySurianto/tpa_web/backend/activity-service/internal/repository"
)

type LikeServiceImpl struct {
	repo repository.LikeRepository
}

func NewLikeService(repo repository.LikeRepository) LikeService {
	return &LikeServiceImpl{repo}
}

func (s *LikeServiceImpl) Like(userID, videoID uint) error {
	return s.repo.AddLike(&model.Like{UserID: userID, VideoID: videoID})
}

func (s *LikeServiceImpl) Unlike(userID, videoID uint) error {
	return s.repo.RemoveLike(&model.Like{UserID: userID, VideoID: videoID})
}

func (s *LikeServiceImpl) IsLiked(userID, videoID uint) (bool, error) {
	return s.repo.IsLiked(userID, videoID)
}

func (s *LikeServiceImpl) GetLikeCount(videoID uint) (int64, error) {
	return s.repo.GetLikeCount(videoID)
}
