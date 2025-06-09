package service

import (
	"github.com/KennedySurianto/tpa_web/backend/chat-service/internal/model"
)

type ChatService interface {
	SendMessage(chat *model.Chat) (*model.Chat, error)
	GetChatsByUserID(userID uint64) ([]*model.Chat, error)
}
