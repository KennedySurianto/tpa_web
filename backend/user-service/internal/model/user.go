package model

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Basic authentication
	Username string `gorm:"uniqueIndex;not null" json:"username"`
	Email    string `gorm:"uniqueIndex;not null" json:"email"`
	Password string `gorm:"not null" json:"-"` // Hide password in JSON responses

	// Profile information
	DisplayName string `json:"display_name"`
	Bio         string `gorm:"type:text" json:"bio"`
	Avatar      []byte `gorm:"type:bytea" json:"-"`

	// TikTok specific attributes
	IsVerified bool `json:"is_verified"`
	IsPrivate  bool `json:"is_private"`

	// Account status
	IsActive    bool      `json:"is_active"`
	LastLoginAt time.Time `json:"last_login_at"`

	// Location (optional)
	Country string `json:"country,omitempty"`

	// Preferences
	AllowDuet     bool `json:"allow_duet"`
	AllowStitch   bool `json:"allow_stitch"`
	AllowDownload bool `json:"allow_download"`
	AllowComments bool `json:"allow_comments"`

	// Notification and Privacy Settings
	NewFollowerNotification bool   `json:"new_follower_notification"`
	MessageNotification     bool   `json:"message_notification"`
	MentionNotification     bool   `json:"mention_notification"`
	LikeTabVisibility       string `json:"like_tab_visibility"`
	ChatRestriction         string `json:"chat_restriction"`
}