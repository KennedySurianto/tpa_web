package service

import (
	"context"
	"encoding/json"
	"fmt"
	"math/rand/v2"
	"os"
	"os/exec"
	"sort"
	"time"

	likepb "github.com/KennedySurianto/tpa_web/backend/shared/gen/like"
	pb "github.com/KennedySurianto/tpa_web/backend/shared/gen/video"
	watchpb "github.com/KennedySurianto/tpa_web/backend/shared/gen/watch"
	commentpb "github.com/KennedySurianto/tpa_web/backend/shared/gen/comment"
	"github.com/KennedySurianto/tpa_web/backend/video-service/internal/model"
	"github.com/KennedySurianto/tpa_web/backend/video-service/internal/repository"
	"github.com/KennedySurianto/tpa_web/backend/video-service/internal/storage"
)

type VideoServiceImpl struct {
	videoRepo repository.VideoRepository
	minio *storage.MinIOClient

	likeClient  likepb.LikeServiceClient
	watchClient watchpb.WatchServiceClient
	commentClient commentpb.CommentServiceClient
}

type Captions struct {
    EN []string `json:"en"`
    ID []string `json:"id"`
}

func NewVideoService(
	videoRepo repository.VideoRepository, 
	minio *storage.MinIOClient, 
	likeClient likepb.LikeServiceClient, 
	watchClient watchpb.WatchServiceClient,
	commentClient commentpb.CommentServiceClient) *VideoServiceImpl {
	return &VideoServiceImpl{
		videoRepo: 	videoRepo,
		minio: 		minio,
		likeClient: likeClient,
		watchClient: watchClient,
		commentClient: commentClient,
	}
}

func generateCaptions(videoPath string) (*Captions, error) {
    cmd := exec.Command("python3", "/app/internal/ai/caption_generator.py", videoPath)
    output, err := cmd.CombinedOutput()
	if err != nil {
		return nil, fmt.Errorf("caption gen failed: %w\nOutput:\n%s", err, string(output))
	}

    var captions Captions
    if err := json.Unmarshal(output, &captions); err != nil {
        return nil, fmt.Errorf("caption parse failed: %w", err)
    }

    return &captions, nil
}

func (s *VideoServiceImpl) CreateVideo(req *pb.CreateVideoRequest) (*model.Video, error) {
	var videoURL string

	fmt.Println("[VIDEO_SERVICE_IMPL] Received CreateVideoRequest:", req.Caption, req.Description, req.AllowComments)

	// Step 0: Start Transaction
	tx := s.videoRepo.BeginTx()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Step 1: Upload to MinIO
	if len(req.VideoData) > 0 && req.ContentType != "" {
		fileName := fmt.Sprintf("user_%d_%d.mp4", req.UserId, time.Now().Unix())
		fmt.Println("[VIDEO_SERVICE_IMPL] Uploading video with filename:", fileName)

		uploadedURL, err := s.minio.UploadVideo(context.Background(), fileName, req.VideoData, req.ContentType)
		if err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("failed to upload video to MinIO: %w", err)
		}
		videoURL = uploadedURL
	} else {
		videoURL = req.VideoUrl
	}

	// Step 2: Save video record
	video := &model.Video{
		UserID:        uint(req.UserId),
		VideoURL:      videoURL,
		Thumbnail:     req.Thumbnail,
		Caption:       req.Caption,
		Description:   stringPtrToString(req.Description),
		Duration:      int(req.Duration),
		SoundID:       uint32PtrToUintPtr(req.SoundId),
		Privacy:       req.Privacy,
		AllowComments: req.AllowComments,
		AllowDuet:     req.AllowDuet,
		AllowStitch:   req.AllowStitch,
	}
	if err := s.videoRepo.CreateVideoTx(tx, video); err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to create video record: %w", err)
	}

	// Step 3: Download video from MinIO for captioning
	tempPath := fmt.Sprintf("temp/user_%d_%d.mp4", req.UserId, time.Now().Unix())
	fmt.Println("[VIDEO_SERVICE_IMPL] Downloading video from MinIO to temp path:", tempPath)
	_ = os.MkdirAll("temp", os.ModePerm)

	if err := s.minio.DownloadFile(context.Background(), video.VideoURL, tempPath); err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("failed to download video from MinIO: %w", err)
	}
	defer os.Remove(tempPath)

	// Step 4: Generate captions
	captions, err := generateCaptions(tempPath)
	if err != nil {
		tx.Rollback()
		return nil, fmt.Errorf("caption generation failed: %w", err)
	}

	// Step 5: Save captions
	for lang, lines := range map[string][]string{"en": captions.EN, "id": captions.ID} {
		cap := &model.Caption{
			VideoID:  video.ID,
			Language: lang,
			Texts:    lines,
		}
		if err := s.videoRepo.SaveCaptionTx(tx, cap); err != nil {
			tx.Rollback()
			return nil, fmt.Errorf("failed to save captions: %w", err)
		}
	}

	// Step 6: Commit the transaction (after everything succeeded)
	if err := tx.Commit().Error; err != nil {
		return nil, fmt.Errorf("failed to commit transaction: %w", err)
	}

	// return the video only after all steps completed
	fmt.Println("[VIDEO_SERVICE_IMPL] Video and captions created successfully with ID:", video.ID)
	return video, nil
}

func (s *VideoServiceImpl) GetVideoByID(id uint) (*model.Video, error) {
	return s.videoRepo.GetVideoByID(id)
}

func (s *VideoServiceImpl) UpdateVideo(req *pb.UpdateVideoRequest) (*model.Video, error) {
	video, err := s.videoRepo.GetVideoByID(uint(req.Id))
	if err != nil {
		return nil, err
	}

	if req.Thumbnail != nil {
		video.Thumbnail = req.Thumbnail
	}
	if req.Caption != nil {
		video.Caption = *req.Caption
	}
	if req.Privacy != nil {
		video.Privacy = *req.Privacy
	}
	if req.AllowComments != nil {
		video.AllowComments = *req.AllowComments
	}
	if req.AllowDuet != nil {
		video.AllowDuet = *req.AllowDuet
	}
	if req.AllowStitch != nil {
		video.AllowStitch = *req.AllowStitch
	}

	err = s.videoRepo.UpdateVideo(video)
	return video, err
}

func (s *VideoServiceImpl) DeleteVideo(id uint) error {
	return s.videoRepo.DeleteVideo(id)
}

func (s *VideoServiceImpl) GetVideosByUserId(req *pb.GetVideosByUserIdRequest) ([]model.Video, error) {
	return s.videoRepo.GetVideosByUserId(uint(req.UserId))
}

// uint32PtrToUintPtr converts a *uint32 to a *uint.
func uint32PtrToUintPtr(u *uint32) *uint {
	if u == nil {
		return nil
	}
	val := uint(*u)
	return &val
}

// stringPtrToString safely dereferences a *string, returning an empty string if nil.
func stringPtrToString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func (s *VideoServiceImpl) GetRecommendedVideos(userID, lastVideoID, deviceID uint32, language string, limit int32) ([]*model.Video, error) {
	videos, err := s.videoRepo.GetRecommendedVideos(userID, lastVideoID, deviceID, language, limit*2) // fetch more for shuffling
	if err != nil {
		return nil, err
	}

	type scoredVideo struct {
		video *model.Video
		score float64
	}

	var scored []scoredVideo
	for _, v := range videos {
		var likeCount, commentCount, viewCount uint64
		if userID != 0 {
			watchedResp, err := s.watchClient.IsWatched(context.Background(), &watchpb.IsWatchedRequest{
				UserId:  userID,
				VideoId: uint32(v.ID),
			})
			if err == nil && watchedResp.Watched {
				continue
			}
		}

		if likeResp, err := s.likeClient.GetVideoLikeCount(context.Background(), &likepb.GetVideoLikeCountRequest{
			VideoId: uint32(v.ID),
		}); err == nil {
			likeCount = likeResp.Count
		}

		if watchResp, err := s.watchClient.GetViewCount(context.Background(), &watchpb.GetViewCountRequest{
			VideoId: uint32(v.ID),
		}); err == nil {
			viewCount = watchResp.Count
		}

		if commentResp, err := s.commentClient.GetCommentCount(context.Background(), &commentpb.GetCommentCountRequest{
			VideoId: uint32(v.ID),
		}); err == nil {
			commentCount = commentResp.Count
		}

		score := 0.5*float64(likeCount) + 0.1*float64(viewCount) + 0.2*float64(commentCount) + 0.2*rand.Float64()
		scored = append(scored, scoredVideo{video: v, score: score})
	}

	sort.Slice(scored, func(i, j int) bool {
		return scored[i].score > scored[j].score
	})

	var recommended []*model.Video
	for _, s := range scored {
		if len(recommended) >= int(limit) {
			break
		}
		recommended = append(recommended, s.video)
	}

	if len(recommended) < int(limit) {
		randoms, _ := s.videoRepo.GetRandomPublicVideos(limit - int32(len(recommended)))
		recommended = append(recommended, randoms...)
	}

	// ✅ Deduplicate
	seen := make(map[uint]bool)
	var deduped []*model.Video
	for _, v := range recommended {
		if !seen[v.ID] {
			seen[v.ID] = true
			deduped = append(deduped, v)
		}
	}

	// ✅ Log final deduplicated IDs
	for _, v := range deduped {
		fmt.Println("Final recommended video ID:", v.ID)
	}

	return deduped, nil
}

func (s *VideoServiceImpl) GetCaptionsByVideoID(videoID uint) ([]model.Caption, error) {
    return s.videoRepo.GetCaptionsByVideoID(videoID)
}
