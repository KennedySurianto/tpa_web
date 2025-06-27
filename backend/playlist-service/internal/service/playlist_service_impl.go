package service

import (
	"context"
	"fmt"

	"github.com/KennedySurianto/tpa_web/backend/playlist-service/internal/model"
	"github.com/KennedySurianto/tpa_web/backend/playlist-service/internal/repository"
	videopb "github.com/KennedySurianto/tpa_web/backend/shared/gen/video"
	pb "github.com/KennedySurianto/tpa_web/backend/shared/gen/playlist"
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

func (s *playlistServiceImpl) UpdatePlaylist(req *pb.UpdatePlaylistRequest) (uint64, error) {
	// Debugging: Print the incoming request
	fmt.Printf("Debug: Updating playlist with ID %d, Name: %s\n", req.Id, req.Name)

	// Create a playlist model for updating
	playlist := &model.Playlist{
		Name:  req.Name,
		VideoIDs: func(ids []uint64) pq.Int64Array {
			int64s := make([]int64, len(ids))
			for i, v := range ids {
				int64s[i] = int64(v)
			}
			return pq.Int64Array(int64s)
		}(req.VideoIds), // Convert []uint64 to pq.Int64Array
	}

	// Update the playlist in the repository
	updatedPlaylist, err := s.repo.Update(req.Id, playlist)
	if err != nil {
		// Debugging: Error updating playlist in repository
		fmt.Printf("Debug: Error updating playlist in repository: %v\n", err)
		return 0, err
	}

	// Return the playlist ID after successful update
	return uint64(updatedPlaylist.ID), nil
}