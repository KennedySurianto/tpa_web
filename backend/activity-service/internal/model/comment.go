package model

import "gorm.io/gorm"

type Comment struct {
	gorm.Model

	UserID    uint           `gorm:"not null" json:"user_id"`
	VideoID   uint           `gorm:"not null" json:"video_id"`
	Content   string         `gorm:"type:text;not null" json:"content"`

	Likes     []LikeComment  `gorm:"foreignKey:CommentID"`
}