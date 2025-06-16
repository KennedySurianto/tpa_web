package repository

import (
	"context"

	"github.com/KennedySurianto/tpa_web/backend/user-service/internal/model"
)

type UserRepository interface {
	CreateUser(user *model.User) error
	GetAllUsers() ([]model.User, error)
	GetUserByEmail(email string) (*model.User, error)
	UpdateUser(updatedUser *model.User) error
	DeleteUser(email string) error
	GetUserById(id uint) (*model.User, error)
	UpdateUserPassword(email string, newPassword string) error
	UpdateLastLogin(userID uint64) error
	FindByUsername(ctx context.Context, username string) (*model.User, error)
}
