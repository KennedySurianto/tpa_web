package repository

import "github.com/KennedySurianto/tpa_web/backend/chat-service/internal/model"

type ChatRepository interface {
	Create(chat *model.Chat) (*model.Chat, error)
	GetByUserID(userID uint64) ([]*model.Chat, error)
}
