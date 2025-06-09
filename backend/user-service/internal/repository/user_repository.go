package repository

import (
	"context"

	"github.com/KennedySurianto/tpa_web/backend/user-service/internal/model"
)

type UserRepository interface {
	CreateUser(user *model.User) error
	GetAllUsers() ([]model.User, error)
	GetUserByEmail(email string) (*model.User, error)
	UpdateUser(email string, updatedUser *model.User) error
	DeleteUser(email string) error
	GetUserById(id uint) (*model.User, error)
	UpdateUserPassword(email string, newPassword string) error

	UpdateUserProfile(userID uint64, displayName, bio, avatarURL, country, username string) error
	UpdateUserPreferences(userID uint64, allowDuet, allowStitch, allowDownload, allowComments bool) error
	SetUserPrivacyStatus(userID uint64, isPrivate bool) error
	SetUserActiveStatus(userID uint64, isActive bool) error
	UpdateLastLogin(userID uint64) error

	FindByUsername(ctx context.Context, username string) (*model.User, error)
}
