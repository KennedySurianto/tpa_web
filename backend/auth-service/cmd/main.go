package main

import (
	"fmt"
	"log"
	"net"
	"os"

	"github.com/KennedySurianto/tpa_web/backend/auth-service/internal/controller"
	"github.com/KennedySurianto/tpa_web/backend/auth-service/internal/service"
	"github.com/KennedySurianto/tpa_web/backend/shared/gen/auth"
	"google.golang.org/grpc"
)

func main() {
	// Get port from environment or use default
	port := getEnv("PORT", "50052")

	// Create a listener on the specified port
	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", port))
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	// Initialize auth service with user service client
	authService := service.NewAuthService()
	authController := controller.NewAuthController(authService)

	// Create gRPC server
	grpcServer := grpc.NewServer()
	auth.RegisterAuthServiceServer(grpcServer, authController)

	log.Println("Auth service running on port 50052")
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("Failed to serve gRPC server: %v", err)
	}
}

// getEnv gets an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}