package repository

import (
	"fmt"

	"github.com/KennedySurianto/tpa_web/backend/playlist-service/internal/model"
	"gorm.io/gorm"
)

type playlistRepositoryImpl struct {
  	db *gorm.DB
}

func NewPlaylistRepository(db *gorm.DB) PlaylistRepository {
	return &playlistRepositoryImpl{db}
}

func (r *playlistRepositoryImpl) Create(p *model.Playlist) error {
	return r.db.Create(p).Error
}

func (r *playlistRepositoryImpl) GetByID(id uint) (*model.Playlist, error) {
	var p model.Playlist
	err := r.db.First(&p, id).Error
	return &p, err
}

func (r *playlistRepositoryImpl) Delete(id uint) error {
	return r.db.Delete(&model.Playlist{}, id).Error
}

func (r *playlistRepositoryImpl) GetByUserId(userId uint) ([]*model.Playlist, error) {
	// Debug: Starting function
	fmt.Printf("Debug: Starting GetByUserId with userId: %d\n", userId)

	var playlists []model.Playlist
	// Query for playlists by user_id
	err := r.db.Where("user_id = ?", userId).Find(&playlists).Error
	if err != nil {
		// Debug: Error during database query
		fmt.Printf("Debug: Error fetching playlists for userId %d: %v\n", userId, err)
		return nil, err
	}

	// Debug: Check if playlists were found
	if len(playlists) == 0 {
		fmt.Printf("Debug: No playlists found for userId %d\n", userId)
	}

	// Convert the playlists slice into a slice of pointers
	result := make([]*model.Playlist, len(playlists))
	for i := range playlists {
		// Debug: Log each playlist ID being processed
		fmt.Printf("Debug: Processing playlist with ID %d\n", playlists[i].ID)
		result[i] = &playlists[i]
	}

	// Debug: Returning the result
	fmt.Printf("Debug: Returning %d playlists for userId %d\n", len(result), userId)

	// Return the list of pointers
	return result, nil
}
