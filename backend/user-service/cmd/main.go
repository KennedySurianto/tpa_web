package main

import (
	"fmt"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	pb "github.com/KennedySurianto/tpa_web/backend/shared/gen/user"
	"github.com/KennedySurianto/tpa_web/backend/user-service/internal/controller"
	"github.com/KennedySurianto/tpa_web/backend/user-service/internal/database"
	"github.com/KennedySurianto/tpa_web/backend/user-service/internal/repository"
	"github.com/KennedySurianto/tpa_web/backend/user-service/internal/service"
	"google.golang.org/grpc"
	"google.golang.org/grpc/health"
	"google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/reflection"
)

func main() {
	// Get port from environment or use default
	port := getEnv("PORT", "50051")

	// Create a listener on the specified port
	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", port))
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	// Set up the dependencies using dependency injection
	userDB := database.ConnectDatabase()
	userRepo := repository.NewUserRepository(userDB)
	userService := service.NewUserService(userRepo)
	userController := controller.NewUserController(userService)
	
	// Create a new gRPC server
	server := grpc.NewServer()

	// Register the service with the server
	pb.RegisterUserServiceServer(server, userController)

	// Register reflection service for grpcurl
	reflection.Register(server)

	// Create and register a gRPC health server
	healthServer := health.NewServer()
	grpc_health_v1.RegisterHealthServer(server, healthServer)
	healthServer.SetServingStatus("user.UserService", grpc_health_v1.HealthCheckResponse_SERVING)

	// Start the server in a goroutine
	go func() {
		log.Printf("User service starting on port %s...\n", port)
		if err := server.Serve(lis); err != nil {
			log.Fatalf("Failed to serve: %v", err)
		}
	}()

	// Create a channel to receive OS signals
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)

	// Block until a signal is received
	sig := <-c
	log.Printf("Received signal %s, shutting down...\n", sig)

	// Gracefully stop the server
	server.GracefulStop()
}

// getEnv gets an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}