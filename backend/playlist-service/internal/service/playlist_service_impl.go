package service

import (
	"context"

	"github.com/KennedySurianto/tpa_web/backend/playlist-service/internal/model"
	"github.com/KennedySurianto/tpa_web/backend/playlist-service/internal/repository"
	videopb "github.com/KennedySurianto/tpa_web/backend/shared/gen/video"
	"github.com/lib/pq"
)

type playlistServiceImpl struct {
  repo repository.PlaylistRepository
  videoClient  videopb.VideoServiceClient
}

func NewPlaylistService(r repository.PlaylistRepository, videoClient videopb.VideoServiceClient) PlaylistService {
  return &playlistServiceImpl{repo: r, videoClient: videoClient}
}

func (s *playlistServiceImpl) Create(name string, userID uint64, videoIDs []uint32) (*model.Playlist, error) {
  ids := make([]int64, len(videoIDs))
  for i, id := range videoIDs {
    ids[i] = int64(id)
  }
  p := &model.Playlist{
    Name:     name,
    UserID:   uint(userID),
    VideoIDs: pq.Int64Array(ids),
  }
  err := s.repo.Create(p)
  return p, err
}

func (s *playlistServiceImpl) Get(id uint) (*model.Playlist, error) {
  return s.repo.GetByID(id)
}

func (s *playlistServiceImpl) Delete(id uint) error {
  return s.repo.Delete(id)
}

func (s *playlistServiceImpl) GetByUserId(userId uint) ([]*model.Playlist, error) {
	// Fetch the playlists for the given user from the repository
	return s.repo.GetByUserId(userId)
}

func (s *playlistServiceImpl) GetVideoById(ctx context.Context, videoId uint32) (*videopb.Video, error) {
	videoResp, err := s.videoClient.GetVideo(ctx, &videopb.GetVideoRequest{Id: videoId})
	if err != nil {
		return nil, err
	}
	return videoResp.Video, nil
}