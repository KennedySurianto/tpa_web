package model

type LikeComment struct {
    UserID  uint        `gorm:"primaryKey"`
    CommentID uint      `gorm:"primaryKey"`

	Comment   Comment `gorm:"foreignKey:CommentID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
}
