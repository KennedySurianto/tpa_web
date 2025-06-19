package main

import (
	"log"
	"net"

	pb "github.com/KennedySurianto/tpa_web/backend/shared/gen/live"
	"github.com/KennedySurianto/tpa_web/backend/live-service/internal/controller"
	"github.com/KennedySurianto/tpa_web/backend/live-service/internal/repository"
	"github.com/KennedySurianto/tpa_web/backend/live-service/internal/service"
	"google.golang.org/grpc"
	"google.golang.org/grpc/health"
	"google.golang.org/grpc/health/grpc_health_v1"
)

func main() {
	repo := repository.NewSignalingRepository()
	service := service.NewSignalingService(repo)
	ctrl := controller.NewSignalingController(service)

	lis, err := net.Listen("tcp", ":50056")
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	grpcServer := grpc.NewServer()
	pb.RegisterLiveServiceServer(grpcServer, ctrl)

	healthServer := health.NewServer()
	grpc_health_v1.RegisterHealthServer(grpcServer, healthServer)
	healthServer.SetServingStatus("live.LiveService", grpc_health_v1.HealthCheckResponse_SERVING)

	log.Println("gRPC server running on :50056")
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
