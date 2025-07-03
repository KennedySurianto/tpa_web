package model

import (
	"gorm.io/datatypes"
)

type Caption struct {
	ID       uint           `gorm:"primaryKey"`
	VideoID  uint           `gorm:"not null;index"`
	Video    Video          `gorm:"foreignKey:VideoID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
	Language string         `gorm:"type:varchar(10);not null"`
	Segments datatypes.JSON `gorm:"type:jsonb;not null"` // [{start, end, text}]
}
