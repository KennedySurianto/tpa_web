package model

import "gorm.io/gorm"

// PushSubscription represents a user's notification subscription in the database.
type PushSubscription struct {
	gorm.Model

	UserID   string `gorm:"not null;index"`
	Endpoint string `gorm:"unique;not null"`
	P256dh   string `gorm:"not null"`
	Auth     string `gorm:"not null"`
}