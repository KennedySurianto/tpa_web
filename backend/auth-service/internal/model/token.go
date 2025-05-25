package model

import "time"

type TokenInfo struct {
	UserId    uint64    `json:"user_id"`
	ExpiresAt time.Time `json:"expires_at"`
}

type AuthUser struct {
	ID          uint64 `json:"id"`
	Username    string `json:"username"`
	Email       string `json:"email"`
	DisplayName string `json:"display_name"`
	AvatarUrl   string `json:"avatar_url"`
	IsVerified  bool   `json:"is_verified"`
	Country     string `json:"country"`
}