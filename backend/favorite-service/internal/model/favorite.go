package model

type Favorite struct {
	UserID    uint           `gorm:"primarykey"`
	VideoID   uint           `gorm:"primarykey"`
}
