package service

import (
	"github.com/KennedySurianto/tpa_web/user-service/internal/model"
	"github.com/KennedySurianto/tpa_web/user-service/internal/repository"
)

type UserServiceImpl struct {
	userRepo repository.UserRepository
}

func NewUserService(userRepo repository.UserRepository) *UserServiceImpl {
	return &UserServiceImpl{
		userRepo: userRepo,
	}
}

func (u *UserServiceImpl) CreateUser(name, email, password string) (string, error) {
	user := &model.User{
		Name:     name,
		Email:    email,
		Password: password,
	}

	err := u.userRepo.CreateUser(user)
	if err != nil {
		return "", err
	}

	return "Success", nil
}

func (u *UserServiceImpl) GetAllUsers() ([]model.User, error) {
	return u.userRepo.GetAllUsers()
}

func (u *UserServiceImpl) GetUserByEmail(email string) (*model.User, error) {
	return u.userRepo.GetUserByEmail(email)
}

func (u *UserServiceImpl) UpdateUser(email, name, password string) error {
	updatedUser := &model.User{
		Name:     name,
		Password: password,
	}
	return u.userRepo.UpdateUser(email, updatedUser)
}

func (u *UserServiceImpl) DeleteUser(email string) error {
	return u.userRepo.DeleteUser(email)
}

func (u *UserServiceImpl) GetUserById(id uint) (*model.User, error) {
	return u.userRepo.GetUserById(id)
}