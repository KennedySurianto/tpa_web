package main

import (
	"fmt"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	userpb "github.com/KennedySurianto/tpa_web/backend/shared/gen/user"
	pb "github.com/KennedySurianto/tpa_web/backend/shared/gen/video"
	likepb "github.com/KennedySurianto/tpa_web/backend/shared/gen/like"
	followpb "github.com/KennedySurianto/tpa_web/backend/shared/gen/follow"
	watchpb "github.com/KennedySurianto/tpa_web/backend/shared/gen/watch"
	commentpb "github.com/KennedySurianto/tpa_web/backend/shared/gen/comment"
	"github.com/KennedySurianto/tpa_web/backend/middleware"
	"github.com/KennedySurianto/tpa_web/backend/video-service/internal/controller"
	"github.com/KennedySurianto/tpa_web/backend/video-service/internal/database"
	"github.com/KennedySurianto/tpa_web/backend/video-service/internal/repository"
	"github.com/KennedySurianto/tpa_web/backend/video-service/internal/service"
	"github.com/KennedySurianto/tpa_web/backend/video-service/internal/storage"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/health"
	"google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/reflection"
)

func main() {
	port := getEnv("PORT", "50053")

	lis, err := net.Listen("tcp", fmt.Sprintf(":%s", port))
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	// Create middleware and gRPC server
	pasetoMaker, err := middleware.NewPasetoMaker()
	if err != nil {
		panic(err)
	}
	interceptor := middleware.UnaryAuthInterceptor(pasetoMaker)
	const maxMsgSize = 1024 * 1024 * 100 // 100 MB
	grpcServer := grpc.NewServer(
		grpc.UnaryInterceptor(interceptor),
		grpc.MaxRecvMsgSize(maxMsgSize),
		grpc.MaxSendMsgSize(maxMsgSize),
	)

	// Clients
	userClient := getUserClient()
	likeClient := getLikeClient()
	followClient := getFollowClient()
	watchClient := getWatchClient()
	commentClient := getCommentClient()

	// Dependency Injection
	db := database.ConnectDatabase()
	videoRepo := repository.NewVideoRepository(db)
	minioClient := storage.NewMinIOClient()
	videoService := service.NewVideoService(videoRepo, minioClient, likeClient, watchClient, commentClient)
	videoController := controller.NewVideoController(videoService, userClient, likeClient, followClient, watchClient, commentClient)

	// Register gRPC service
	pb.RegisterVideoServiceServer(grpcServer, videoController)
	reflection.Register(grpcServer)

	// Create and register a gRPC health server
	healthServer := health.NewServer()
	grpc_health_v1.RegisterHealthServer(grpcServer, healthServer)
	healthServer.SetServingStatus("video.VideoService", grpc_health_v1.HealthCheckResponse_SERVING)

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

func getUserClient() userpb.UserServiceClient {
	// Initialize services
	userServiceHost := os.Getenv("USER_SERVICE_HOST")
    userServicePort := os.Getenv("USER_SERVICE_PORT")

	conn, err := grpc.NewClient(
        fmt.Sprintf("%s:%s", userServiceHost, userServicePort),
        grpc.WithTransportCredentials(insecure.NewCredentials()),
    )

    if err != nil {
        log.Fatalf("Failed to connect to user service: %v", err)
    }
    
	return userpb.NewUserServiceClient(conn) 
}

func getLikeClient() likepb.LikeServiceClient {
	activityServiceHost := os.Getenv("ACTIVITY_SERVICE_HOST")
    activityServicePort := os.Getenv("ACTIVITY_SERVICE_PORT")

	conn, err := grpc.NewClient(
        fmt.Sprintf("%s:%s", activityServiceHost, activityServicePort),
        grpc.WithTransportCredentials(insecure.NewCredentials()),
    )

    if err != nil {
        log.Fatalf("Failed to connect to activity service: %v", err)
    }
    
	return likepb.NewLikeServiceClient(conn) 
}

func getFollowClient() followpb.FollowServiceClient {
	followServiceHost := os.Getenv("ACTIVITY_SERVICE_HOST")
	followServicePort := os.Getenv("ACTIVITY_SERVICE_PORT")

	conn, err := grpc.NewClient(
        fmt.Sprintf("%s:%s", followServiceHost, followServicePort),
        grpc.WithTransportCredentials(insecure.NewCredentials()),
    )

    if err != nil {
        log.Fatalf("Failed to connect to activity service: %v", err)
    }
    
	return followpb.NewFollowServiceClient(conn)
}

func getWatchClient() watchpb.WatchServiceClient {
	watchServiceHost := os.Getenv("ACTIVITY_SERVICE_HOST")
	watchServicePort := os.Getenv("ACTIVITY_SERVICE_PORT")

	conn, err := grpc.NewClient(
        fmt.Sprintf("%s:%s", watchServiceHost, watchServicePort),
        grpc.WithTransportCredentials(insecure.NewCredentials()),
    )

    if err != nil {
        log.Fatalf("Failed to connect to activity service: %v", err)
    }
    
	return watchpb.NewWatchServiceClient(conn)
}

func getCommentClient() commentpb.CommentServiceClient {
	commentServiceHost := os.Getenv("ACTIVITY_SERVICE_HOST")
	commentServicePort := os.Getenv("ACTIVITY_SERVICE_PORT")

	conn, err := grpc.NewClient(
        fmt.Sprintf("%s:%s", commentServiceHost, commentServicePort),
        grpc.WithTransportCredentials(insecure.NewCredentials()),
    )

    if err != nil {
        log.Fatalf("Failed to connect to activity service: %v", err)
    }
    
	return commentpb.NewCommentServiceClient(conn)
}