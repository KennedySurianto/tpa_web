package service

import (
	"context"

	videopb "github.com/KennedySurianto/tpa_web/backend/shared/gen/video"
)

// FavoriteService defines the interface for the favorite service's business logic.
type FavoriteService interface {
	AddFavorite(ctx context.Context, userId, videoId uint) error
	RemoveFavorite(ctx context.Context, userId, videoId uint) error
	GetFavoriteVideos(ctx context.Context, userId, currentUserId uint) ([]*videopb.Video, error)
	IsFavorited(ctx context.Context, userId, videoId uint) (bool, error)
}
