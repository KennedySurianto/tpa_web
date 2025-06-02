package controller

import (
	"context"

	"github.com/KennedySurianto/tpa_web/backend/activity-service/internal/service"
	pb "github.com/KennedySurianto/tpa_web/backend/shared/gen/like"
)

type LikeController struct {
	pb.UnimplementedLikeServiceServer
	service service.LikeService
}

func NewLikeController(svc service.LikeService) *LikeController {
	return &LikeController{service: svc}
}

func (s *LikeController) Like(ctx context.Context, req *pb.LikeRequest) (*pb.LikeResponse, error) {
	err := s.service.Like(uint(req.UserId), uint(req.VideoId))
	return &pb.LikeResponse{}, err
}

func (s *LikeController) Unlike(ctx context.Context, req *pb.UnlikeRequest) (*pb.UnlikeResponse, error) {
	err := s.service.Unlike(uint(req.UserId), uint(req.VideoId))
	return &pb.UnlikeResponse{}, err
}

func (s *LikeController) IsLiked(ctx context.Context, req *pb.IsLikedRequest) (*pb.IsLikedResponse, error) {
	liked, err := s.service.IsLiked(uint(req.UserId), uint(req.VideoId))
	return &pb.IsLikedResponse{Liked: liked}, err
}
