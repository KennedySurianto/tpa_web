package model

import (
	"time"
)

type Video struct {
	ID            uint       `json:"id"`
	UserID        uint       `json:"user_id"`        // Owner of the video
	VideoURL      string     `json:"video_url"`
	Thumbnail     []byte     `json:"-"`              // Omit in the response
	Caption       string     `json:"caption"`
	Description   string     `json:"description"`
	Duration      int        `json:"duration"`        // in seconds
	SoundID       *uint      `json:"sound_id,omitempty"`
	Privacy       string     `json:"privacy"`         // public, private, friends
	ViewsCount    uint       `json:"views_count"`
	LikesCount    uint       `json:"likes_count"`
	CommentsCount uint       `json:"comments_count"`
	AllowComments bool       `json:"allow_comments"`
	AllowDuet     bool       `json:"allow_duet"`
	AllowStitch   bool       `json:"allow_stitch"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
	DeletedAt     *time.Time `json:"deleted_at,omitempty"` // nullable
}
