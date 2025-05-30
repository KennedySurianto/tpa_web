package model

import (
	"gorm.io/gorm"
)

type Video struct {
	gorm.Model

	// Video metadata
	UserID       uint   `gorm:"not null;index" json:"user_id"` // Owner of the video
	VideoURL     string `gorm:"not null" json:"video_url"`
	ThumbnailURL string `json:"thumbnail_url"`
	Caption      string `gorm:"type:text" json:"caption"`
	Description  string `gorm:"type:text" json:"description"`
	Duration     int    `json:"duration"` // in seconds

	// Optional associations
	SoundID *uint  `json:"sound_id,omitempty"`
	Privacy string `gorm:"default:'public'" json:"privacy"` // public, private, friends

	// Cached metrics (optional for performance; updated asynchronously)
	ViewsCount    uint `gorm:"default:0" json:"views_count"`
	LikesCount    uint `gorm:"default:0" json:"likes_count"`
	CommentsCount uint `gorm:"default:0" json:"comments_count"`

	// Feature flags (editable by creator)
	AllowComments bool `gorm:"default:true" json:"allow_comments"`
	AllowDuet     bool `gorm:"default:true" json:"allow_duet"`
	AllowStitch   bool `gorm:"default:true" json:"allow_stitch"`

	// Soft deletes & timestamps handled by gorm.Model
}
