package repository

import (
	"context"

	"github.com/KennedySurianto/tpa_web/backend/notification-service/internal/model"
	"gorm.io/gorm"
)

type notificationRepositoryImpl struct {
	db *gorm.DB
}

func NewNotificationRepository(db *gorm.DB) NotificationRepository {
	return &notificationRepositoryImpl{db: db}
}

func (r *notificationRepositoryImpl) SaveSubscription(ctx context.Context, sub *model.PushSubscription) error {
	// Using .WithContext to pass the context to GORM
	return r.db.WithContext(ctx).Create(sub).Error
}

func (r *notificationRepositoryImpl) GetSubscriptionsByUserID(ctx context.Context, userID string) ([]*model.PushSubscription, error) {
	var subscriptions []model.PushSubscription
	err := r.db.WithContext(ctx).Where("user_id = ?", userID).Find(&subscriptions).Error
	if err != nil {
		return nil, err
	}

	// Convert to a slice of pointers to match the playlist-service example
	result := make([]*model.PushSubscription, len(subscriptions))
	for i := range subscriptions {
		result[i] = &subscriptions[i]
	}

	return result, nil
}