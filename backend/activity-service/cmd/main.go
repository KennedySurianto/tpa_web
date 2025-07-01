package main

import (
	"fmt"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	"github.com/KennedySurianto/tpa_web/backend/activity-service/internal/controller"
	"github.com/KennedySurianto/tpa_web/backend/activity-service/internal/database"
	"github.com/KennedySurianto/tpa_web/backend/activity-service/internal/repository"
	"github.com/KennedySurianto/tpa_web/backend/activity-service/internal/service"
	commentpb "github.com/KennedySurianto/tpa_web/backend/shared/gen/comment"
	likepb "github.com/KennedySurianto/tpa_web/backend/shared/gen/like"
	watchpb "github.com/KennedySurianto/tpa_web/backend/shared/gen/watch"
	userpb "github.com/KennedySurianto/tpa_web/backend/shared/gen/user"
	likecommentpb "github.com/KennedySurianto/tpa_web/backend/shared/gen/like_comment"
	followpb "github.com/KennedySurianto/tpa_web/backend/shared/gen/follow"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/health"
	"google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/reflection"
	"github.com/KennedySurianto/tpa_web/backend/middleware"
)

func main() {
	port := getEnv("PORT", "50054")
	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", port))
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	// Database connection
	db := database.ConnectDatabase()
	
	// Repositories
	commentRepo := repository.NewCommentRepository(db)
	likeRepo := repository.NewLikeRepository(db)
	watchRepo := repository.NewWatchRepository(db)
	likeCommentRepo := repository.NewLikeCommentRepository(db)
	followRepo := repository.NewFollowRepository(db)
	
	// Services
	commentSvc := service.NewCommentService(commentRepo)
	likeSvc := service.NewLikeService(likeRepo)
	watchSvc := service.NewWatchService(watchRepo)
	likeCommentSvc := service.NewLikeCommentService(likeCommentRepo)
	followSvc := service.NewFollowService(followRepo)

	// Clients
	userClient := getUserClient()

	// Controllers
	likeCtrl := controller.NewLikeController(likeSvc)
	watchCtrl := controller.NewWatchController(watchSvc)
	likeCommentCtrl := controller.NewLikeCommentController(likeCommentSvc)
	commentCtrl := controller.NewCommentController(commentSvc, userClient, *likeCommentCtrl)
	followCtrl := controller.NewFollowController(followSvc, userClient)
	
	// Create middleware and gRPC server
	pasetoMaker, err := middleware.NewPasetoMaker()
	if err != nil {
		log.Fatalln(err)
	}
	interceptor := middleware.UnaryAuthInterceptor(pasetoMaker)
	grpcServer := grpc.NewServer(grpc.UnaryInterceptor(interceptor))

	commentpb.RegisterCommentServiceServer(grpcServer, commentCtrl)
	likepb.RegisterLikeServiceServer(grpcServer, likeCtrl)
	watchpb.RegisterWatchServiceServer(grpcServer, watchCtrl)
	likecommentpb.RegisterLikeCommentServiceServer(grpcServer, likeCommentCtrl)
	followpb.RegisterFollowServiceServer(grpcServer, followCtrl)

	// Enable reflection (useful for debugging tools like grpcurl)
	reflection.Register(grpcServer)

	// Create and register a gRPC health server
	healthServer := health.NewServer()
	grpc_health_v1.RegisterHealthServer(grpcServer, healthServer)
	healthServer.SetServingStatus("activity.ActivityService", grpc_health_v1.HealthCheckResponse_SERVING)

	// Start serving in a goroutine
	go func() {
		log.Printf("Activity service starting on port %s...\n", port)
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("Failed to serve: %v", err)
		}
	}()

	// Handle graceful shutdown
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)

	sig := <-c
	log.Printf("Received signal %s, shutting down...\n", sig)
	grpcServer.GracefulStop()
}

func getEnv(key, defaultValue string) string {
	val := os.Getenv(key)
	if val == "" {
		return defaultValue
	}
	return val
}

func getUserClient() userpb.UserServiceClient {
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
    
	return userpb.NewUserServiceClient(conn) 
}
