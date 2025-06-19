package service

import (
	"github.com/KennedySurianto/tpa_web/backend/live-service/internal/model"
	"github.com/KennedySurianto/tpa_web/backend/live-service/internal/repository"
)

type SignalingServiceImpl struct {
	repo repository.SignalingRepository
}

func NewSignalingService(repo repository.SignalingRepository) SignalingService {
	return &SignalingServiceImpl{repo: repo}
}

func (s *SignalingServiceImpl) JoinRoom(userID uint32) chan model.Signal {
	return s.repo.GetChannel(userID)
}

func (s *SignalingServiceImpl) SendSignal(signal model.Signal) {
	s.repo.StoreSignal(signal)
}
