package repository

import (
	"github.com/KennedySurianto/tpa_web/backend/chat-service/internal/model"
	"gorm.io/gorm"
)

type ChatRepositoryImpl struct {
	db *gorm.DB
}

func NewChatRepository(db *gorm.DB) ChatRepository {
	return &ChatRepositoryImpl{db}
}

func (r *ChatRepositoryImpl) Create(chat *model.Chat) (*model.Chat, error) {
	err := r.db.Create(chat).Error
	return chat, err
}

func (r *ChatRepositoryImpl) GetByUserID(userID uint64) ([]*model.Chat, error) {
	var chats []*model.Chat
	err := r.db.
		Where("sender_id = ? OR receiver_id = ?", userID, userID).
		Order("created_at ASC").
		Find(&chats).Error
	return chats, err
}

func (r *ChatRepositoryImpl) GetBetweenUsers(user1, user2 uint64) ([]*model.Chat, error) {
	var chats []*model.Chat
	err := r.db.
		Where("(sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)",
			user1, user2, user2, user1).
		Order("created_at ASC").
		Find(&chats).Error
	return chats, err
}
