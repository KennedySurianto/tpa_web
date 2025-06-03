package model

import "gorm.io/gorm"

type Comment struct {
	gorm.Model

	UserID    uint           `gorm:"not null" json:"user_id"`
	VideoID   uint           `gorm:"not null" json:"video_id"`
	Content   string         `gorm:"type:text;not null" json:"content"`

	ReplyToID *uint         `gorm:"index" json:"reply_to_id"`
	ReplyTo   *Comment      `gorm:"foreignKey:ReplyToID" json:"-"`

	Likes     []LikeComment  `gorm:"foreignKey:CommentID"`
	Replies   []Comment      `gorm:"foreignKey:ReplyToID" json:"replies,omitempty"`
}