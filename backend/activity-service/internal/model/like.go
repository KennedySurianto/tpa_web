package model

type Like struct {
    UserID  uint      `gorm:"primaryKey"`
    VideoID uint      `gorm:"primaryKey"`
}
