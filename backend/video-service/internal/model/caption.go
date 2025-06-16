package model

import "gorm.io/gorm"

type Caption struct {
	gorm.Model
	VideoID  uint     `gorm:"not null;index"`
	Language string   `gorm:"type:varchar(10);not null"`
	Texts    []string `gorm:"type:text[]"`
}
