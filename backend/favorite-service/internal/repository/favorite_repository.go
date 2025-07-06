package repository

import "github.com/KennedySurianto/tpa_web/backend/favorite-service/internal/model"

// FavoriteRepository defines the interface for favorite data operations.
type FavoriteRepository interface {
	Create(favorite *model.Favorite) error
	Delete(userId, videoId uint) error
	GetByUserId(userId uint) ([]model.Favorite, error)
	FindByUserAndVideo(userId, videoId uint) (*model.Favorite, error)
}
