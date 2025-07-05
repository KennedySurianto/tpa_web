package main

import (
	"fmt"
	"log"
	"net"
	"os"

	"github.com/KennedySurianto/tpa_web/backend/notification-service/internal/controller"
	"github.com/KennedySurianto/tpa_web/backend/notification-service/internal/database"
	"github.com/KennedySurianto/tpa_web/backend/notification-service/internal/repository"
	"github.com/KennedySurianto/tpa_web/backend/notification-service/internal/service"
	pb "github.com/KennedySurianto/tpa_web/backend/shared/gen/notification"
	"google.golang.org/grpc"
	"google.golang.org/grpc/health"
	"google.golang.org/grpc/health/grpc_health_v1"
)

func main() {
	// Get port from environment or use default
	port := os.Getenv("PORT")

	// Create a listener on the specified port
	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", port))
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}
  
	vapidPublicKey := os.Getenv("VAPID_PUBLIC_KEY")
	vapidPrivateKey := os.Getenv("VAPID_PRIVATE_KEY")

	db := database.ConnectDatabase()
	repo := repository.NewNotificationRepository(db)
	svc := service.NewNotificationService(repo, vapidPublicKey, vapidPrivateKey)
	ctrl := controller.NewNotificationController(svc)

	// Create gRPC server
	grpcServer := grpc.NewServer()
	pb.RegisterNotificationServiceServer(grpcServer, ctrl)

	// Create and register a gRPC health server
	healthServer := health.NewServer()
	grpc_health_v1.RegisterHealthServer(grpcServer, healthServer)
	healthServer.SetServingStatus("notification.NotificationService", grpc_health_v1.HealthCheckResponse_SERVING)

	log.Println("Notification service running on port 50058")
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("Failed to serve gRPC server: %v", err)
	}
}
