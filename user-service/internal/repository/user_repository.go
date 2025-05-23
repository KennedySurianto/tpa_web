package repository

import "github.com/KennedySurianto/tpa_web/user-service/internal/model"

type UserRepository interface {
	CreateUser(user *model.User) error
	GetAllUsers() ([]model.User, error)
	GetUserByEmail(email string) (*model.User, error)
	UpdateUser(email string, updatedUser *model.User) error
	DeleteUser(email string) error
	GetUserById(id uint) (*model.User, error)
}