package main

import (
	"fmt"
	"log"
	"net"
	"os"
	"time"

	"github.com/KennedySurianto/tpa_web/backend/auth-service/internal/controller"
	"github.com/KennedySurianto/tpa_web/backend/auth-service/internal/memcacheclient"
	"github.com/KennedySurianto/tpa_web/backend/auth-service/internal/service"
	"github.com/KennedySurianto/tpa_web/backend/middleware"
	"github.com/KennedySurianto/tpa_web/backend/shared/gen/auth"
	"github.com/KennedySurianto/tpa_web/backend/shared/gen/user"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/health"
	"google.golang.org/grpc/health/grpc_health_v1"
)

func printDevBanner() {
	fmt.Println()
	fmt.Println("========================================")
	fmt.Println("🛠️  AUTH SERVICE - DEV MODE - HOT RELOAD")
	fmt.Println("📦  Version: DEV")
	fmt.Println("🚀  Listening on :50052")
	fmt.Println("========================================")
	fmt.Println()
}

func main() {
	printDevBanner()
	fmt.Println("🕒 Rebuild time:", time.Now().Format(time.RFC1123))

	// Get port from environment or use default
	port := getEnv("PORT", "50052")

	// Create a listener on the specified port
	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", port))
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}
    
	userClient := getUserClient()
	pasetoMaker, err := middleware.NewPasetoMaker()
	if err != nil {
		panic(err)
	}
	memcacheHost := getEnv("MEMCACHED_HOST", ":11211")
	memcacheClient := memcacheclient.NewMemcacheClient(memcacheHost)
	authService := service.NewAuthService(userClient, pasetoMaker, memcacheClient)
	otpService := service.NewOTPService(memcacheClient)
	authController := controller.NewAuthController(authService, otpService, userClient)

	// Create middleware and gRPC server
	// interceptor := middleware.UnaryAuthInterceptor(pasetoMaker)
	// grpcServer := grpc.NewServer(grpc.UnaryInterceptor(interceptor))
	
	// pake ini aja buat auth karna gada routes yg hrs di protect
	grpcServer := grpc.NewServer()

	auth.RegisterAuthServiceServer(grpcServer, authController)

	// Create and register a gRPC health server
	healthServer := health.NewServer()
	grpc_health_v1.RegisterHealthServer(grpcServer, healthServer)
	healthServer.SetServingStatus("auth.AuthService", grpc_health_v1.HealthCheckResponse_SERVING)

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

func getUserClient() user.UserServiceClient {
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
    
	return user.NewUserServiceClient(conn) 
}