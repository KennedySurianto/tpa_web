package repository

import (
	"github.com/KennedySurianto/tpa_web/backend/favorite-service/internal/model"
	"gorm.io/gorm"
)

type favoriteRepositoryImpl struct {
	db *gorm.DB
}

// NewFavoriteRepository creates a new instance of FavoriteRepository.
func NewFavoriteRepository(db *gorm.DB) FavoriteRepository {
	return &favoriteRepositoryImpl{db: db}
}

// Create adds a new favorite record to the database.
func (r *favoriteRepositoryImpl) Create(f *model.Favorite) error {
	return r.db.Create(f).Error
}

// Delete removes a favorite record from the database.
func (r *favoriteRepositoryImpl) Delete(userId, videoId uint) error {
	return r.db.Where("user_id = ? AND video_id = ?", userId, videoId).Delete(&model.Favorite{}).Error
}

// GetByUserId retrieves all favorite records for a given user.
func (r *favoriteRepositoryImpl) GetByUserId(userId uint) ([]model.Favorite, error) {
	var favorites []model.Favorite
	err := r.db.Where("user_id = ?", userId).Find(&favorites).Error
	return favorites, err
}

// FindByUserAndVideo checks if a specific video is favorited by a specific user.
func (r *favoriteRepositoryImpl) FindByUserAndVideo(userId, videoId uint) (*model.Favorite, error) {
	var favorite model.Favorite
	err := r.db.Where("user_id = ? AND video_id = ?", userId, videoId).First(&favorite).Error
	if err != nil {
		return nil, err
	}
	return &favorite, nil
}
