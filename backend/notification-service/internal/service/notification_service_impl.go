package service

import (
	"context"
	"encoding/json"
	"log"

	"github.com/KennedySurianto/tpa_web/backend/notification-service/internal/model"
	"github.com/KennedySurianto/tpa_web/backend/notification-service/internal/repository"
	webpush "github.com/SherClockHolmes/webpush-go"
)

type notificationServiceImpl struct {
	repo            repository.NotificationRepository
	vapidPublicKey  string
	vapidPrivateKey string
}

func NewNotificationService(r repository.NotificationRepository, pubKey, privKey string) NotificationService {
	return &notificationServiceImpl{
		repo:            r,
		vapidPublicKey:  pubKey,
		vapidPrivateKey: privKey,
	}
}

func (s *notificationServiceImpl) Subscribe(ctx context.Context, userID string, sub *model.PushSubscription) error {
	sub.UserID = userID // Ensure UserID is set
	return s.repo.SaveSubscription(ctx, sub)
}

func (s *notificationServiceImpl) SendNotificationToUser(ctx context.Context, userID, title, body, icon string) error {
	subscriptions, err := s.repo.GetSubscriptionsByUserID(ctx, userID)
	if err != nil {
		return err // Return error if DB fails
	}

	if len(subscriptions) == 0 {
		log.Printf("No subscriptions found for user: %s", userID)
		return nil // Correctly returns success if no devices are subscribed
	}

	payload, _ := json.Marshal(map[string]string{"title": title, "body": body, "icon": icon})

	var firstError error // Variable to hold the first error we encounter

	for _, subModel := range subscriptions {
		sub := &webpush.Subscription{
			Endpoint: subModel.Endpoint,
			Keys:     webpush.Keys{P256dh: subModel.P256dh, Auth: subModel.Auth},
		}

		resp, err := webpush.SendNotification(payload, sub, &webpush.Options{
			VAPIDPublicKey:  s.vapidPublicKey,
			VAPIDPrivateKey: s.vapidPrivateKey,
			Subscriber:      "mailto:your-email@example.com",
		})

		if err != nil {
			log.Printf("Failed to send notification to endpoint %s: %v", sub.Endpoint, err)
			if firstError == nil {
				firstError = err // Save the first error
			}
			continue
		}
		// FIX: Don't use defer in a loop. Close the body immediately.
		resp.Body.Close()
	}

	// FIX: Return the first error encountered, so Postman shows a failure.
	return firstError
}