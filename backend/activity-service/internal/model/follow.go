package model

type Follow struct {
	FollowerID uint `gorm:"primaryKey"`
	FollowedID uint `gorm:"primaryKey"`
}
