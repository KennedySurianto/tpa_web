package repository

import (
	"errors"

	"github.com/KennedySurianto/tpa_web/user-service/internal/model"
	"gorm.io/gorm"
)

type UserRepositoryImpl struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepositoryImpl {
	return &UserRepositoryImpl{
		db: db,
	}
}

func (r *UserRepositoryImpl) CreateUser(user *model.User) error {
	err := r.db.Create(user).Error
	if err != nil {
		return err
	}
	return nil
}

func (r *UserRepositoryImpl) GetAllUsers() ([]model.User, error) {
	var users []model.User
	err := r.db.Find(&users).Error
	return users, err
}

func (r *UserRepositoryImpl) GetUserByEmail(email string) (*model.User, error) {
	var user model.User
	err := r.db.Where("email = ?", email).First(&user).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	return &user, err
}

func (r *UserRepositoryImpl) UpdateUser(email string, updatedUser *model.User) error {
	return r.db.Model(&model.User{}).Where("email = ?", email).Updates(updatedUser).Error
}

func (r *UserRepositoryImpl) DeleteUser(email string) error {
	return r.db.Where("email = ?", email).Delete(&model.User{}).Error
}

func (r *UserRepositoryImpl) GetUserById(id uint) (*model.User, error) {
	var user model.User
	err := r.db.First(&user, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	return &user, err
}