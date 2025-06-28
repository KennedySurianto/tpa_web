package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/KennedySurianto/tpa_web/backend/video-service/internal/model"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

type VideoRepositoryImpl struct {
	db *gorm.DB
}

func NewVideoRepository(db *gorm.DB) VideoRepository {
	return &VideoRepositoryImpl{db: db}
}

func (r *VideoRepositoryImpl) CreateVideo(video *model.Video) error {
	fmt.Println("[REPO] allow_comments: ", video.AllowComments)
	return r.db.Create(video).Error
}

func (r *VideoRepositoryImpl) GetVideoByID(id uint) (*model.Video, error) {
	var video model.Video
	err := r.db.First(&video, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	return &video, err
}

func (r *VideoRepositoryImpl) UpdateVideo(video *model.Video) error {
	return r.db.Save(video).Error
}

func (r *VideoRepositoryImpl) DeleteVideo(id uint) error {
	return r.db.Delete(&model.Video{}, id).Error
}

func (r *VideoRepositoryImpl) GetVideosByUserId(userID uint) ([]model.Video, error) {
	var videos []model.Video

	query := r.db.Model(&model.Video{}).Where("user_id = ?", userID)

	err := query.Find(&videos).Error
	return videos, err
}

func (r *VideoRepositoryImpl) GetRecommendedVideos(userID, lastVideoID, deviceID uint32, language string, limit int32) ([]*model.Video, error) {
	var videos []*model.Video

	query := r.db.WithContext(context.Background()).
		Model(&model.Video{}).
		Where("privacy = ?", "public"). // Only show public videos
		Where("deleted_at IS NULL").     // Exclude soft-deleted
		Order("created_at DESC").
		Limit(int(limit))

	// Optional: pagination
	if lastVideoID != 0 {
		var lastVideo model.Video
		if err := r.db.First(&lastVideo, "id = ?", lastVideoID).Error; err == nil {
			query = query.Where("(created_at < ?) OR (created_at = ? AND id < ?)", lastVideo.CreatedAt, lastVideo.CreatedAt, lastVideo.ID)
		}
	}

	if userID != 0 {
		query = query.Where("user_id != ?", userID) // exclude the user's own videos
	}

	if err := query.Find(&videos).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch recommended videos: %w", err)
	}

	return videos, nil
}

func (r *VideoRepositoryImpl) GetRandomPublicVideos(limit int32) ([]*model.Video, error) {
	var videos []*model.Video
	err := r.db.Where("privacy = ?", "public").Order("RANDOM()").Limit(int(limit)).Find(&videos).Error
	return videos, err
}

func (r *VideoRepositoryImpl) SaveCaption(c *model.Caption) error {
	return r.db.Create(c).Error
}

func (r *VideoRepositoryImpl) GetCaptionsByVideoID(videoID uint) ([]model.Caption, error) {
	var captions []model.Caption
	err := r.db.Where("video_id = ?", videoID).Find(&captions).Error
	return captions, err
}

// new functions
func (r *VideoRepositoryImpl) BeginTx() *gorm.DB {
	return r.db.Begin()
}

func (r *VideoRepositoryImpl) CreateVideoTx(tx *gorm.DB, video *model.Video) error {
	return tx.Create(video).Error
}

func (r *VideoRepositoryImpl) SaveCaptionTx(tx *gorm.DB, caption *model.Caption) error {
	return tx.Model(&model.Caption{}).Create(map[string]interface{}{
		"video_id":   caption.VideoID,
		"language":   caption.Language,
		"texts":      pq.Array(caption.Texts),
		"created_at": time.Now(),
		"updated_at": time.Now(),
	}).Error
}

func (r *VideoRepositoryImpl) GetAllVideos() ([]model.Video, error) {
	var videos []model.Video
	err := r.db.
		Model(&model.Video{}).
		Where("privacy = ?", "public").
		Where("deleted_at IS NULL").
		Order("created_at DESC").
		Find(&videos).Error
	return videos, err
}
