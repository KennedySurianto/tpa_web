package service

import (
	"github.com/KennedySurianto/tpa_web/backend/chat-service/internal/model"
	"github.com/KennedySurianto/tpa_web/backend/chat-service/internal/repository"
)

type ChatServiceImpl struct {
	repo repository.ChatRepository
}

func NewChatService(repo repository.ChatRepository) ChatService {
	return &ChatServiceImpl{repo}
}

func (s *ChatServiceImpl) SendMessage(chat *model.Chat) (*model.Chat, error) {
	return s.repo.Create(chat)
}

func (s *ChatServiceImpl) GetChatsByUserID(userID uint64) ([]*model.Chat, error) {
	return s.repo.GetByUserID(userID)
}
