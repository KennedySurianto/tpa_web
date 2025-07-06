package controller

import (
	"context"

	pb "github.com/KennedySurianto/tpa_web/backend/shared/gen/favorite"
	"github.com/KennedySurianto/tpa_web/backend/favorite-service/internal/service"
)

// FavoriteController implements the gRPC server for the FavoriteService.
type FavoriteController struct {
	pb.UnimplementedFavoriteServiceServer
	svc service.FavoriteService
}

// NewFavoriteController creates a new FavoriteController.
func NewFavoriteController(s service.FavoriteService) *FavoriteController {
	return &FavoriteController{
		svc: s,
	}
}

// AddFavorite handles the request to add a video to favorites.
func (c *FavoriteController) AddFavorite(ctx context.Context, req *pb.AddFavoriteRequest) (*pb.AddFavoriteResponse, error) {
	err := c.svc.AddFavorite(ctx, uint(req.UserId), uint(req.VideoId))
	if err != nil {
		return &pb.AddFavoriteResponse{Success: false}, nil
	}
	return &pb.AddFavoriteResponse{Success: true}, nil
}

// RemoveFavorite handles the request to remove a video from favorites.
func (c *FavoriteController) RemoveFavorite(ctx context.Context, req *pb.RemoveFavoriteRequest) (*pb.RemoveFavoriteResponse, error) {
	err := c.svc.RemoveFavorite(ctx, uint(req.UserId), uint(req.VideoId))
	if err != nil {
		return &pb.RemoveFavoriteResponse{Success: false}, err
	}
	return &pb.RemoveFavoriteResponse{Success: true}, nil
}

// GetFavoriteVideosByUserId handles the request to get all favorited videos for a user.
func (c *FavoriteController) GetFavoriteVideosByUserId(ctx context.Context, req *pb.GetFavoriteVideosByUserIdRequest) (*pb.GetFavoriteVideosByUserIdResponse, error) {
	videos, err := c.svc.GetFavoriteVideos(ctx, uint(req.UserId), uint(req.CurrentUserId))
	if err != nil {
		return nil, err
	}
	return &pb.GetFavoriteVideosByUserIdResponse{Videos: videos}, nil
}

// IsFavorited checks if a video is in the user's favorites.
func (c *FavoriteController) IsFavorited(ctx context.Context, req *pb.IsFavoritedRequest) (*pb.IsFavoritedResponse, error) {
	isFavorited, err := c.svc.IsFavorited(ctx, uint(req.UserId), uint(req.VideoId))
	if err != nil {
		return nil, err
	}
	return &pb.IsFavoritedResponse{IsFavorited: isFavorited}, nil
}
