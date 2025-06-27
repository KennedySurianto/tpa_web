package service

import (
	"context"

	"github.com/KennedySurianto/tpa_web/backend/playlist-service/internal/model"
	videopb "github.com/KennedySurianto/tpa_web/backend/shared/gen/video"
)

type PlaylistService interface {
	Create(name string, userID uint64, videoIDs []uint32) (*model.Playlist, error)
	Get(id uint) (*model.Playlist, error)
	Delete(id uint) error
	GetByUserId(userId uint) ([]*model.Playlist, error)
	GetVideoById(ctx context.Context, videoId uint32) (*videopb.Video, error)
}