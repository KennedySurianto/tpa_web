package model

import (
	"gorm.io/gorm"
	"github.com/lib/pq"
)

type Playlist struct {
	gorm.Model

	Name     string       	`gorm:"not null"`
	UserID   uint			`gorm:"not null;index" json:"user_id"`			
	VideoIDs pq.Int64Array 	`gorm:"type:integer[]"`
}
