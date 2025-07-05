package service

import (
	"context"

	"github.com/KennedySurianto/tpa_web/backend/notification-service/internal/model"
)

type NotificationService interface {
	Subscribe(ctx context.Context, userID string, sub *model.PushSubscription) error
	SendNotificationToUser(ctx context.Context, userID, title, body, icon string) error
}