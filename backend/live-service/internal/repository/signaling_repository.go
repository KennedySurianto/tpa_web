package repository

import (
	"github.com/KennedySurianto/tpa_web/backend/live-service/internal/model"
)

type SignalingRepository interface {
	StoreSignal(signal model.Signal)
	GetChannel(userID uint32) chan model.Signal
}
