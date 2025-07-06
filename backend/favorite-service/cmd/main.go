package main

import (
	"fmt"
	"log"
	"net"
	"os"

	"github.com/KennedySurianto/tpa_web/backend/favorite-service/internal/controller"
	"github.com/KennedySurianto/tpa_web/backend/favorite-service/internal/database"
	"github.com/KennedySurianto/tpa_web/backend/favorite-service/internal/repository"
	"github.com/KennedySurianto/tpa_web/backend/favorite-service/internal/service"
	pb "github.com/KennedySurianto/tpa_web/backend/shared/gen/favorite"
	video "github.com/KennedySurianto/tpa_web/backend/shared/gen/video"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/health"
	"google.golang.org/grpc/health/grpc_health_v1"
)

func main() {
	// Get port from environment or use default
	port := getEnv("PORT", "50059")

	// Create a listener on the specified port
	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", port))
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}
    
	videoClient := getVideoClient()

	db := database.ConnectDatabase()
	repo := repository.NewFavoriteRepository(db)
	svc := service.NewFavoriteService(repo, videoClient)
	ctrl := controller.NewFavoriteController(svc)

	// Create gRPC server
	grpcServer := grpc.NewServer()
	pb.RegisterFavoriteServiceServer(grpcServer, ctrl)

	// Create and register a gRPC health server
	healthServer := health.NewServer()
	grpc_health_v1.RegisterHealthServer(grpcServer, healthServer)
	healthServer.SetServingStatus("favorite.FavoriteService", grpc_health_v1.HealthCheckResponse_SERVING)

	log.Println("Favorite service running on port 50059")
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("Failed to serve gRPC server: %v", err)
	}
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

func getVideoClient() video.VideoServiceClient {
	// Initialize services
	videoServiceHost := os.Getenv("VIDEO_SERVICE_HOST")
	videoServicePort := os.Getenv("VIDEO_SERVICE_PORT")

	conn, err := grpc.NewClient(
        fmt.Sprintf("%s:%s", videoServiceHost, videoServicePort),
        grpc.WithTransportCredentials(insecure.NewCredentials()),
    )

    if err != nil {
        log.Fatalf("Failed to connect to video service: %v", err)
    }
    
	return video.NewVideoServiceClient(conn) 
}