package service

import (
	"context"
	"fmt"

	"github.com/KennedySurianto/tpa_web/backend/favorite-service/internal/model"
	"github.com/KennedySurianto/tpa_web/backend/favorite-service/internal/repository"
	videopb "github.com/KennedySurianto/tpa_web/backend/shared/gen/video"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type favoriteServiceImpl struct {
	repo        repository.FavoriteRepository
	videoClient videopb.VideoServiceClient
}

// NewFavoriteService creates a new instance of FavoriteService.
func NewFavoriteService(r repository.FavoriteRepository, vc videopb.VideoServiceClient) FavoriteService {
	return &favoriteServiceImpl{repo: r, videoClient: vc}
}

// AddFavorite adds a video to a user's favorites.
func (s *favoriteServiceImpl) AddFavorite(ctx context.Context, userId, videoId uint) error {
	fav := &model.Favorite{
		UserID:  userId,
		VideoID: videoId,
	}
	err := s.repo.Create(fav)
	return err
}

// RemoveFavorite removes a video from a user's favorites.
func (s *favoriteServiceImpl) RemoveFavorite(ctx context.Context, userId, videoId uint) error {
	return s.repo.Delete(userId, videoId)
}

// GetFavoriteVideos retrieves all videos favorited by a user.
func (s *favoriteServiceImpl) GetFavoriteVideos(ctx context.Context, userId, currentUserId uint) ([]*videopb.Video, error) {
	favorites, err := s.repo.GetByUserId(userId)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get favorites: %v", err)
	}

	var videos []*videopb.Video
	for _, fav := range favorites {
		// Fetch video details from the video-service
		videoResp, err := s.videoClient.GetVideo(ctx, &videopb.GetVideoRequest{
			VideoId:       uint64(fav.VideoID),
			CurrentUserId: uint64(currentUserId),
		})
		if err != nil {
			// It's possible a video was deleted, so we just log the error and continue
			fmt.Printf("Warning: failed to get video details for video ID %d: %v\n", fav.VideoID, err)
			continue
		}
		if videoResp != nil && videoResp.Video != nil {
			videos = append(videos, videoResp.Video)
		}
	}

	return videos, nil
}

// IsFavorited checks if a user has favorited a specific video.
func (s *favoriteServiceImpl) IsFavorited(ctx context.Context, userId, videoId uint) (bool, error) {
	_, err := s.repo.FindByUserAndVideo(userId, videoId)
	if err != nil {
		if err.Error() == "record not found" { // gorm.ErrRecordNotFound is not exported
			return false, nil
		}
		return false, err
	}
	return true, nil
}
