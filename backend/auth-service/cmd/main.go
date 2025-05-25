package main

import (
	"log"
	"net"

	"github.com/KennedySurianto/tpa_web/backend/auth-service/internal/controller"
	"github.com/KennedySurianto/tpa_web/backend/auth-service/internal/service"
	"github.com/KennedySurianto/tpa_web/backend/shared/gen/auth"
	"google.golang.org/grpc"
)

func main() {
	// Initialize auth service with user service client
	authService := service.NewAuthService()
	authController := controller.NewAuthController(authService)

	// Create gRPC server
	grpcServer := grpc.NewServer()
	auth.RegisterAuthServiceServer(grpcServer, authController)

	// Start listening on port 50052
	listener, err := net.Listen("tcp", ":50052")
	if err != nil {
		log.Fatalf("Failed to listen on port 50052: %v", err)
	}

	log.Println("Auth service running on port 50052")
	if err := grpcServer.Serve(listener); err != nil {
		log.Fatalf("Failed to serve gRPC server: %v", err)
	}
}