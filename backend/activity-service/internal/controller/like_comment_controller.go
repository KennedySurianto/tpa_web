package controller

import (
	"context"

	"github.com/KennedySurianto/tpa_web/backend/activity-service/internal/service"
	pb "github.com/KennedySurianto/tpa_web/backend/shared/gen/like_comment"
)

type LikeCommentController struct {
	pb.UnimplementedLikeCommentServiceServer
	service service.LikeCommentService
}

func NewLikeCommentController(svc service.LikeCommentService) *LikeCommentController {
	return &LikeCommentController{service: svc}
}

func (s *LikeCommentController) LikeComment(ctx context.Context, req *pb.LikeCommentRequest) (*pb.LikeCommentResponse, error) {
	err := s.service.LikeComment(uint(req.UserId), uint(req.CommentId))
	return &pb.LikeCommentResponse{}, err
}

func (s *LikeCommentController) UnlikeComment(ctx context.Context, req *pb.UnlikeCommentRequest) (*pb.UnlikeCommentResponse, error) {
	err := s.service.UnlikeComment(uint(req.UserId), uint(req.CommentId))
	return &pb.UnlikeCommentResponse{}, err
}

func (s *LikeCommentController) IsCommentLiked(ctx context.Context, req *pb.IsCommentLikedRequest) (*pb.IsCommentLikedResponse, error) {
	liked, err := s.service.IsCommentLiked(uint(req.UserId), uint(req.CommentId))
	return &pb.IsCommentLikedResponse{Liked: liked}, err
}

func (s *LikeCommentController) GetLikeCount(ctx context.Context, req *pb.GetLikeCountRequest) (*pb.GetLikeCountResponse, error) {
	count, err := s.service.GetLikeCount(uint(req.CommentId))
	if err != nil {
		return nil, err
	}
	return &pb.GetLikeCountResponse{Count: uint64(count)}, nil
}
