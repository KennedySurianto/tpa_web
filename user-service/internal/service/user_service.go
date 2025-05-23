package service

import "github.com/KennedySurianto/tpa_web/user-service/internal/model"

type UserService interface {
	CreateUser(name, email, password string) (string, error)
	GetAllUsers() ([]model.User, error)
	GetUserByEmail(email string) (*model.User, error)
	UpdateUser(email, name, password string) error
	DeleteUser(email string) error
	GetUserById(id uint) (*model.User, error)
}
