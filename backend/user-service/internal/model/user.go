package model

import (
	"time"
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	
	// Basic authentication
	Username string `gorm:"uniqueIndex;not null" json:"username"`
	Email    string `gorm:"uniqueIndex;not null" json:"email"`
	Password string `gorm:"not null" json:"-"` // Hide password in JSON responses
	
	// Profile information
	DisplayName string `json:"display_name"`
	Bio         string `gorm:"type:text" json:"bio"`
	Avatar      []byte `gorm:"type:bytea" json:"-"`
	
	// TikTok specific attributes
	IsVerified   bool `gorm:"default:false" json:"is_verified"`
	IsPrivate    bool `gorm:"default:false" json:"is_private"`
	
	// Account status
	IsActive    bool      `gorm:"default:true" json:"is_active"`
	LastLoginAt time.Time `json:"last_login_at"`
	
	// Location (optional)
	Country string `json:"country,omitempty"`
	
	// Preferences
	AllowDuet        bool `gorm:"default:true" json:"allow_duet"`
	AllowStitch      bool `gorm:"default:true" json:"allow_stitch"`
	AllowDownload    bool `gorm:"default:true" json:"allow_download"`
	AllowComments    bool `gorm:"default:true" json:"allow_comments"`
}