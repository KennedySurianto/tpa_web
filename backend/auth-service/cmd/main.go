package main

import (
	"fmt"
	"log"
	"net"
	"os"

	"github.com/KennedySurianto/tpa_web/backend/auth-service/internal/controller"
	"github.com/KennedySurianto/tpa_web/backend/auth-service/internal/memcache"
	"github.com/KennedySurianto/tpa_web/backend/auth-service/internal/service"
	"github.com/KennedySurianto/tpa_web/backend/shared/gen/auth"
	"github.com/KennedySurianto/tpa_web/backend/shared/gen/user"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func main() {
	// Get port from environment or use default
	port := getEnv("PORT", "50052")

	// Create a listener on the specified port
	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", port))
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	// Initialize services
	userServiceHost := os.Getenv("USER_SERVICE_HOST")
    userServicePort := os.Getenv("USER_SERVICE_PORT")
    
    if userServiceHost == "" {
        userServiceHost = "user-service" // Docker service name
    }

    if userServicePort == "" {
        userServicePort = "50051"
    }

	conn, err := grpc.NewClient(
        fmt.Sprintf("%s:%s", userServiceHost, userServicePort),
        grpc.WithTransportCredentials(insecure.NewCredentials()),
    )

    if err != nil {
        log.Fatalf("Failed to connect to user service: %v", err)
    }
    
    userClient := user.NewUserServiceClient(conn)

	authService := service.NewAuthService(userClient)
	memcacheHost := getEnv("MEMCACHED_HOST", ":11211")
	memcacheClient := memcache.NewMemcacheClient(memcacheHost)
	otpService := service.NewOTPService(memcacheClient)
	authController := controller.NewAuthController(authService, otpService, userClient)

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