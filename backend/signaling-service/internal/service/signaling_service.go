package service

import "github.com/KennedySurianto/tpa_web/backend/signaling-service/internal/model"

type SignalingService interface {
	JoinRoom(userID uint32) chan model.Signal
	SendSignal(signal model.Signal)
}
