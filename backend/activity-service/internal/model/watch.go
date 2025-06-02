package model

type Watch struct {
    UserID       uint      `gorm:"primaryKey"`
    VideoID      uint      `gorm:"primaryKey"`
}
