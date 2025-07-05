package repository

import (
	"context"

	"github.com/KennedySurianto/tpa_web/backend/notification-service/internal/model"
)

// NotificationRepository defines the updated interface
type NotificationRepository interface {
	SaveSubscription(ctx context.Context, sub *model.PushSubscription) error
	GetSubscriptionsByUserID(ctx context.Context, userID string) ([]*model.PushSubscription, error)
}