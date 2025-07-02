package controller

import (
	"context"
	"fmt"
	"time"

	pb "github.com/KennedySurianto/tpa_web/backend/shared/gen/playlist"
	videopb "github.com/KennedySurianto/tpa_web/backend/shared/gen/video"
	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/KennedySurianto/tpa_web/backend/playlist-service/internal/model"
	"github.com/KennedySurianto/tpa_web/backend/playlist-service/internal/service"
)

type PlaylistController struct {
	pb.UnimplementedPlaylistServiceServer
	svc service.PlaylistService
}

func NewPlaylistController(s service.PlaylistService) *PlaylistController {
	return &PlaylistController{
		svc: s,
	}
}

func (c *PlaylistController) CreatePlaylist(ctx context.Context, req *pb.CreatePlaylistRequest) (*pb.CreatePlaylistResponse, error) {
	ids := make([]uint32, len(req.VideoIds))
	for i, v := range req.VideoIds {
		ids[i] = uint32(v) // v is uint64, convert to uint32
	}
	p, err := c.svc.Create(req.Name, req.UserId, ids)
	if err != nil {
		return nil, err
	}
	return &pb.CreatePlaylistResponse{PlaylistId: uint64(p.ID)}, nil
}

func (c *PlaylistController) GetPlaylist(ctx context.Context, req *pb.GetPlaylistRequest) (*pb.Playlist, error) {
	// Fetch the playlist for the given ID
	p, err := c.svc.Get(uint(req.Id))
	if err != nil {
		return nil, err
	}

	// Collect video details for each video ID in the playlist
	var videoDetails []*videopb.Video
	for _, videoID := range p.VideoIDs {
		// Fetch video details by ID using the service method
		videoResp, err := c.svc.GetVideoById(ctx, uint64(videoID), req.CurrentUserId)
		if err != nil {
			return nil, err
		}
		if videoResp != nil {
			// Convert video from video-service to model.Video and map to protobuf
			videoModel := c.convertVideoToModel(videoResp)
			videoDetails = append(videoDetails, &videopb.Video{
				Id:            uint32(videoModel.ID),
				UserId:        uint32(videoModel.UserID),
				VideoUrl:      videoModel.VideoURL,
				Thumbnail:     videoModel.Thumbnail,
				Caption:       videoModel.Caption,
				Description:   func(s string) *string { return &s }(videoModel.Description),
				Duration:      int32(videoModel.Duration),
				SoundId:       func(u *uint) *uint32 { if u != nil { v := uint32(*u); return &v }; return nil }(videoModel.SoundID),
				Privacy:       videoModel.Privacy,
				ViewsCount:    uint32(videoModel.ViewsCount),
				LikesCount:    uint32(videoModel.LikesCount),
				CommentsCount: uint32(videoModel.CommentsCount),
				AllowComments: videoModel.AllowComments,
				AllowDuet:     videoModel.AllowDuet,
				AllowStitch:   videoModel.AllowStitch,
				CreatedAt:     timestamppb.New(videoModel.CreatedAt),
				UpdatedAt:     timestamppb.New(videoModel.UpdatedAt),
				DeletedAt:     func() *timestamppb.Timestamp { if videoModel.DeletedAt != nil { return timestamppb.New(*videoModel.DeletedAt) }; return nil }(),
				IsPublished: videoModel.IsPublished,
			})
		}
	}

	// Map the playlist data to protobuf response format
	return &pb.Playlist{
		Id:        uint64(p.ID),
		Name:      p.Name,
		UserId:    uint64(p.UserID),
		Videos:    videoDetails, // Add the video details here
		CreatedAt: timestamppb.New(p.CreatedAt),
		UpdatedAt: timestamppb.New(p.UpdatedAt),
		DeletedAt: timestamppb.New(p.DeletedAt.Time),
	}, nil
}

func (c *PlaylistController) DeletePlaylist(ctx context.Context, req *pb.DeletePlaylistRequest) (*pb.DeletePlaylistResponse, error) {
	err := c.svc.Delete(uint(req.Id))
	return &pb.DeletePlaylistResponse{Success: err == nil}, err
}

// Convert a video from the video-service to a model.Video for the playlist-service
func (c *PlaylistController) convertVideoToModel(videoResp *videopb.Video) *model.Video {
	// Manually map fields from videoResp (video-service) to model.Video (playlist-service)
	return &model.Video{
		ID:            uint(videoResp.Id),              // Convert ID to uint
		UserID:        uint(videoResp.UserId),          // Convert UserID to uint
		VideoURL:      videoResp.VideoUrl,              // Direct mapping
		Thumbnail:     videoResp.Thumbnail,             // Direct mapping
		Caption:       videoResp.Caption,               // Direct mapping
		Description:   func() string { if videoResp.Description != nil { return *videoResp.Description }; return "" }(), // Safely dereference
		Duration:      int(videoResp.Duration),         // Convert int32 to int
		SoundID:       func() *uint { if videoResp.SoundId != nil { v := uint(*videoResp.SoundId); return &v }; return nil }(), // Convert *uint32 to *uint
		Privacy:       videoResp.Privacy,               // Direct mapping
		ViewsCount:    uint(videoResp.ViewsCount),      // Convert uint32 to uint
		LikesCount:    uint(videoResp.LikesCount),      // Convert uint32 to uint
		CommentsCount: uint(videoResp.CommentsCount),   // Convert uint32 to uint
		AllowComments: videoResp.AllowComments,         // Direct mapping
		AllowDuet:     videoResp.AllowDuet,             // Direct mapping
		AllowStitch:   videoResp.AllowStitch,           // Direct mapping
		CreatedAt:     videoResp.CreatedAt.AsTime(),    // Convert timestamp to time.Time
		UpdatedAt:     videoResp.UpdatedAt.AsTime(),    // Convert timestamp to time.Time
		DeletedAt:     func() *time.Time { if videoResp.DeletedAt != nil { t := videoResp.DeletedAt.AsTime(); return &t }; return nil }(), // Convert timestamp to *time.Time (nullable)
	}
}

func (c *PlaylistController) GetPlaylistsByUserId(ctx context.Context, req *pb.GetPlaylistRequest) (*pb.GetPlaylistByUserIdResponse, error) {
	// Debug: Start of function
	fmt.Println("Debug: Starting GetPlaylistsByUserId function.")

	// Fetch the playlists for the given user ID
	playlists, err := c.svc.GetByUserId(uint(req.Id))
	if err != nil {
		// Debug: Error fetching playlists
		fmt.Printf("Debug: Error fetching playlists for user ID %d: %v\n", req.Id, err)
		return nil, err
	}

	// Debug: Number of playlists fetched
	fmt.Printf("Debug: Fetched %d playlists for user ID %d.\n", len(playlists), req.Id)

	// Collect the video details for each playlist
	var result []*pb.Playlist
	for _, p := range playlists {
		// Debug: Current playlist being processed
		fmt.Printf("Debug: Processing playlist with ID %d, Name: %s\n", p.ID, p.Name)

		// Fetch video details from video-service
		var videoDetails []*videopb.Video
		for _, videoID := range p.VideoIDs {
			// Debug: Fetching video details for the current video ID
			fmt.Printf("Debug: Fetching video details for VideoID: %d\n", videoID)

			videoResp, err := c.svc.GetVideoById(ctx, uint64(videoID), req.CurrentUserId) // Reuse the GetVideoById method
			if err != nil {
				// Debug: Error fetching video details
				fmt.Printf("Debug: Error fetching video details for VideoID %d: %v\n", videoID, err)
				return nil, err
			}
			if videoResp != nil {
				// Debug: Successfully fetched video details
				fmt.Printf("Debug: Successfully fetched video details for VideoID %d\n", videoID)

				// Convert video from video-service to model.Video and directly append to result
				videoModel := c.convertVideoToModel(videoResp)
				videoDetails = append(videoDetails, &videopb.Video{
					Id:            uint32(videoModel.ID),
					UserId:        uint32(videoModel.UserID),
					VideoUrl:      videoModel.VideoURL,
					Thumbnail:     videoModel.Thumbnail,
					Caption:       videoModel.Caption,
					Description:   func(s string) *string { return &s }(videoModel.Description),
					Duration:      int32(videoModel.Duration),
					SoundId:       func(u *uint) *uint32 { if u != nil { v := uint32(*u); return &v }; return nil }(videoModel.SoundID),
					Privacy:       videoModel.Privacy,
					ViewsCount:    uint32(videoModel.ViewsCount),
					LikesCount:    uint32(videoModel.LikesCount),
					CommentsCount: uint32(videoModel.CommentsCount),
					AllowComments: videoModel.AllowComments,
					AllowDuet:     videoModel.AllowDuet,
					AllowStitch:   videoModel.AllowStitch,
					CreatedAt:     timestamppb.New(videoModel.CreatedAt),
					UpdatedAt:     timestamppb.New(videoModel.UpdatedAt),
					DeletedAt:     func() *timestamppb.Timestamp { if videoModel.DeletedAt != nil { return timestamppb.New(*videoModel.DeletedAt) }; return nil }(),
					IsPublished: videoModel.IsPublished,
				})
			} else {
				// Debug: Video not found or missing
				fmt.Printf("Debug: No video details found for VideoID %d\n", videoID)
			}
		}

		// Debug: Number of videos added to the playlist
		fmt.Printf("Debug: Added %d videos to playlist ID %d\n", len(videoDetails), p.ID)

		// Map the playlist data to protobuf response format
		result = append(result, &pb.Playlist{
			Id:        uint64(p.ID),
			Name:      p.Name,
			UserId:    uint64(p.UserID),
			Videos:    videoDetails,
			CreatedAt: timestamppb.New(p.CreatedAt),
			UpdatedAt: timestamppb.New(p.UpdatedAt),
			DeletedAt: timestamppb.New(p.DeletedAt.Time),
		})
	}

	// Debug: Returning final result
	fmt.Printf("Debug: Returning %d playlists for user ID %d\n", len(result), req.Id)

	return &pb.GetPlaylistByUserIdResponse{Playlists: result}, nil
}

func (c *PlaylistController) UpdatePlaylist(ctx context.Context, req *pb.UpdatePlaylistRequest) (*pb.UpdatePlaylistResponse, error) {
	// Debugging: Print the incoming request for update
	fmt.Printf("Debug: Received request to update playlist with ID %d\n", req.Id)

	// Call the service to update the playlist
	playlistID, err := c.svc.UpdatePlaylist(req)
	if err != nil {
		// Debugging: Error updating playlist
		fmt.Printf("Debug: Error updating playlist with ID %d: %v\n", req.Id, err)
		return nil, err
	}

	// Return the response with updated playlist ID
	return &pb.UpdatePlaylistResponse{
		PlaylistId: playlistID,
	}, nil
}