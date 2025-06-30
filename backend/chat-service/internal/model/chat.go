package model

import (
	"gorm.io/gorm"
)

type ChatType string

const (
	TextType  ChatType = "text"
	ImageType ChatType = "image"
	VideoType ChatType = "video"
)

type Chat struct {
	gorm.Model

	SenderID   		uint     		`gorm:"not null"`
	ReceiverID 		uint     		`gorm:"not null"`
	Type 			ChatType 		`gorm:"type:text;not null"`
	Message    		string   		`gorm:"type:text;not null"`
	Image      		[]byte   		`gorm:"type:bytea"`
}