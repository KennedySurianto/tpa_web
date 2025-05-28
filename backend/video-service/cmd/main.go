package main

import (
	"fmt"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	pb "github.com/KennedySurianto/tpa_web/backend/shared/gen/video"
	"github.com/KennedySurianto/tpa_web/backend/video-service/internal/controller"
	"github.com/KennedySurianto/tpa_web/backend/video-service/internal/database"
	"github.com/KennedySurianto/tpa_web/backend/video-service/internal/repository"
	"github.com/KennedySurianto/tpa_web/backend/video-service/internal/service"

	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

func main() {
	port := getEnv("PORT", "50053")

	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", port))
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	grpcServer := grpc.NewServer()

	// Dependency Injection
	db := database.ConnectDatabase()
	videoRepo := repository.NewVideoRepository(db)
	videoService := service.NewVideoService(videoRepo)
	videoController := controller.NewVideoController(videoService)

	// Register gRPC service
	pb.RegisterVideoServiceServer(grpcServer, videoController)
	reflection.Register(grpcServer)

	// Run gRPC server
	go func() {
		log.Printf("Video service is running on port %s...\n", port)
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("Failed to serve: %v", err)
		}
	}()

	// Graceful shutdown
	waitForShutdown()
}

func getEnv(key, defaultValue string) string {
	val := os.Getenv(key)
	if val == "" {
		return defaultValue
	}
	return val
}

func waitForShutdown() {
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM)

	sig := <-sigCh
	log.Printf("Received signal %s, shutting down...\n", sig)
}
