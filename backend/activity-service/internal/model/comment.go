package model

import (
	"time"
)

type Comment struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`

	UserID    uint           `gorm:"not null" json:"user_id"`
	VideoID   uint           `gorm:"not null" json:"video_id"`
	Content   string         `gorm:"type:text;not null" json:"content"`

	ReplyToID *uint          `gorm:"index" json:"reply_to_id"`
	ReplyTo   *Comment       `gorm:"foreignKey:ReplyToID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"-"`

	Likes     []LikeComment  `gorm:"foreignKey:CommentID"`
	Replies   []Comment      `gorm:"foreignKey:ReplyToID" json:"replies,omitempty"`
}