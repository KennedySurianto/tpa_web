package controller

import (
	"context"

	"github.com/KennedySurianto/tpa_web/backend/notification-service/internal/model"
	"github.com/KennedySurianto/tpa_web/backend/notification-service/internal/service"
	pb "github.com/KennedySurianto/tpa_web/backend/shared/gen/notification"
)

type NotificationController struct {
	pb.UnimplementedNotificationServiceServer
	svc service.NotificationService
}

func NewNotificationController(s service.NotificationService) *NotificationController {
	return &NotificationController{
		svc: s,
	}
}

func (c *NotificationController) Subscribe(ctx context.Context, req *pb.SubscribeRequest) (*pb.SubscribeResponse, error) {
	subModel := &model.PushSubscription{
		Endpoint: req.Subscription.Endpoint,
		P256dh:   req.Subscription.P256Dh,
		Auth:     req.Subscription.Auth,
	}

	err := c.svc.Subscribe(ctx, req.UserId, subModel)
	if err != nil {
		return &pb.SubscribeResponse{Success: false, Message: "Failed to subscribe: " + err.Error()}, nil
	}

	return &pb.SubscribeResponse{Success: true, Message: "Subscribed successfully"}, nil
}

func (c *NotificationController) SendNotificationToUser(ctx context.Context, req *pb.SendNotificationToUserRequest) (*pb.SendNotificationResponse, error) {
	err := c.svc.SendNotificationToUser(ctx, req.UserId, req.Title, req.Body, req.IconUrl)
	if err != nil {
		return &pb.SendNotificationResponse{Success: false}, err
	}

	return &pb.SendNotificationResponse{Success: true}, nil
}