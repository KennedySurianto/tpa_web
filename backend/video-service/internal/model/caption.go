package model

import (
	"github.com/lib/pq"
	"gorm.io/gorm"
)

type Caption struct {
	gorm.Model
	VideoID  uint     		`gorm:"not null;index"`
	Language string   		`gorm:"type:varchar(10);not null"`
	Texts    pq.StringArray `gorm:"type:text[]"`
}
