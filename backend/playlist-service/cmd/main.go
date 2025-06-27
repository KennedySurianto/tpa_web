package main

import (
	"fmt"
	"log"
	"net"
	"os"

	"github.com/KennedySurianto/tpa_web/backend/playlist-service/internal/controller"
	"github.com/KennedySurianto/tpa_web/backend/playlist-service/internal/database"
	"github.com/KennedySurianto/tpa_web/backend/playlist-service/internal/repository"
	"github.com/KennedySurianto/tpa_web/backend/playlist-service/internal/service"
	pb "github.com/KennedySurianto/tpa_web/backend/shared/gen/playlist"
	video "github.com/KennedySurianto/tpa_web/backend/shared/gen/video"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/health"
	"google.golang.org/grpc/health/grpc_health_v1"
)

func main() {
	// Get port from environment or use default
	port := getEnv("PORT", "50057")

	// Create a listener on the specified port
	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", port))
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}
    
	videoClient := getVideoClient()

	db := database.ConnectDatabase()
	repo := repository.NewPlaylistRepository(db)
	svc := service.NewPlaylistService(repo, videoClient)
	ctrl := controller.NewPlaylistController(svc)

	// Create gRPC server
	grpcServer := grpc.NewServer()
	pb.RegisterPlaylistServiceServer(grpcServer, ctrl)

	// Create and register a gRPC health server
	healthServer := health.NewServer()
	grpc_health_v1.RegisterHealthServer(grpcServer, healthServer)
	healthServer.SetServingStatus("playlist.PlaylistService", grpc_health_v1.HealthCheckResponse_SERVING)

	log.Println("Auth service running on port 50057")
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