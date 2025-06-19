package repository

import (
	"sync"
	"github.com/KennedySurianto/tpa_web/backend/signaling-service/internal/model"
)

type SignalingRepositoryImpl struct {
	userChannels map[uint32]chan model.Signal
	mu           sync.RWMutex
}

func NewSignalingRepository() SignalingRepository {
	return &SignalingRepositoryImpl{
		userChannels: make(map[uint32]chan model.Signal),
	}
}

func (r *SignalingRepositoryImpl) StoreSignal(signal model.Signal) {
	r.mu.RLock()
	if ch, ok := r.userChannels[signal.Receiver]; ok {
		ch <- signal
	}
	r.mu.RUnlock()
}

func (r *SignalingRepositoryImpl) GetChannel(userID uint32) chan model.Signal {
	r.mu.Lock()
	defer r.mu.Unlock()
	ch, exists := r.userChannels[userID]
	if !exists {
		ch = make(chan model.Signal, 100)
		r.userChannels[userID] = ch
	}
	return ch
}
