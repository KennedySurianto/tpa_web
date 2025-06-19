package repository

import "github.com/KennedySurianto/tpa_web/backend/chat-service/internal/model"

type ChatRepository interface {
	Create(chat *model.Chat) (*model.Chat, error)
	SoftDeleteMessage(messageId uint32) error
	GetByUserID(userID uint64) ([]*model.Chat, error)
	GetBetweenUsers(user1, user2 uint64) ([]*model.Chat, error)
}
