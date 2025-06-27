package repository

import "github.com/KennedySurianto/tpa_web/backend/playlist-service/internal/model"

type PlaylistRepository interface {
	Create(playlist *model.Playlist) error
	GetByID(id uint) (*model.Playlist, error)
	Delete(id uint) error
	GetByUserId(userId uint) ([]*model.Playlist, error)
}