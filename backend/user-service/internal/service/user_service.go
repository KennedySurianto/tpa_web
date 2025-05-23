package service

import "github.com/KennedySurianto/tpa_web/user-service/internal/model"

type UserService interface {
	CreateUser(name, email, password string) (string, error)
	GetAllUsers() ([]model.User, error)
	GetUserByEmail(email string) (*model.User, error)
	UpdateUser(email, name, password string) error
	DeleteUser(email string) error
	GetUserById(id uint) (*model.User, error)

	UpdateUserProfile(userID uint64, displayName, bio, avatarURL, country string) error
	UpdateUserPreferences(userID uint64, allowDuet, allowStitch, allowDownload, allowComments bool) error
	SetUserPrivacyStatus(userID uint64, isPrivate bool) error
	SetUserActiveStatus(userID uint64, isActive bool) error
	UpdateLastLogin(userID uint64) error
}
