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
	return &playlistRepositoryImpl{db: db}
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

func (r *playlistRepositoryImpl) Update(playlistId uint64, playlist *model.Playlist) (*model.Playlist, error) {
	var existingPlaylist model.Playlist
	err := r.db.First(&existingPlaylist, playlistId).Error
	if err != nil {
		return nil, err // Error if playlist doesn't exist
	}

	// Debug: Log the existing playlist and the update fields
	fmt.Printf("Debug: Updating playlist with ID %d\n", playlistId)
	fmt.Printf("Debug: Existing Playlist Name: %s, New Playlist Name: %s\n", existingPlaylist.Name, playlist.Name)

	// Update the playlist's name, video IDs, and video order
	existingPlaylist.Name = playlist.Name
	existingPlaylist.VideoIDs = playlist.VideoIDs

	// Save the updated playlist
	err = r.db.Save(&existingPlaylist).Error
	if err != nil {
		// Debug: Error saving the updated playlist
		fmt.Printf("Debug: Error saving the updated playlist: %v\n", err)
		return nil, err
	}

	// Debug: Successfully updated playlist
	fmt.Printf("Debug: Successfully updated playlist with ID %d\n", playlistId)

	return &existingPlaylist, nil
}
