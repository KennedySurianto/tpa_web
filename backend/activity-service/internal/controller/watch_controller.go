package controller

import (
	"context"

	pb "github.com/KennedySurianto/tpa_web/backend/shared/gen/watch"
	"github.com/KennedySurianto/tpa_web/backend/activity-service/internal/service"
)

type WatchController struct {
	pb.UnimplementedWatchServiceServer
	service service.WatchService
}

func NewWatchController(svc service.WatchService) *WatchController {
	return &WatchController{service: svc}
}

func (s *WatchController) Watch(ctx context.Context, req *pb.WatchRequest) (*pb.WatchResponse, error) {
	err := s.service.Watch(uint(req.UserId), uint(req.VideoId))
	return &pb.WatchResponse{}, err
}

func (s *WatchController) Unwatch(ctx context.Context, req *pb.UnwatchRequest) (*pb.UnwatchResponse, error) {
	err := s.service.Unwatch(uint(req.UserId), uint(req.VideoId))
	return &pb.UnwatchResponse{}, err
}

func (s *WatchController) IsWatched(ctx context.Context, req *pb.IsWatchedRequest) (*pb.IsWatchedResponse, error) {
	watched, err := s.service.IsWatched(uint(req.UserId), uint(req.VideoId))
	return &pb.IsWatchedResponse{Watched: watched}, err
}

func (s *WatchController) GetViewCount(ctx context.Context, req *pb.GetViewCountRequest) (*pb.GetViewCountResponse, error) {
	count, err := s.service.GetViewCount(uint(req.VideoId))
	if err != nil {
		return nil, err
	}
	return &pb.GetViewCountResponse{Count: uint64(count)}, nil
}
