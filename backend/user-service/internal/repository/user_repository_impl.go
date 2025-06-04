package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/KennedySurianto/tpa_web/backend/user-service/internal/model"
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
	return r.db.Create(user).Error
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

func (r *UserRepositoryImpl) UpdateUserPassword(email string, newPassword string) error {
	return r.db.Model(&model.User{}).Where("email = ?", email).Update("password", newPassword).Error
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

// New methods implementation

func (r *UserRepositoryImpl) UpdateUserProfile(userID uint64, displayName, bio, avatarURL, country string) error {
	return r.db.Model(&model.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"display_name": displayName,
		"bio":          bio,
		"avatar_url":   avatarURL,
		"country":      country,
	}).Error
}

func (r *UserRepositoryImpl) UpdateUserPreferences(userID uint64, allowDuet, allowStitch, allowDownload, allowComments bool) error {
	return r.db.Model(&model.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"allow_duet":     allowDuet,
		"allow_stitch":   allowStitch,
		"allow_download": allowDownload,
		"allow_comments": allowComments,
	}).Error
}

func (r *UserRepositoryImpl) SetUserPrivacyStatus(userID uint64, isPrivate bool) error {
	return r.db.Model(&model.User{}).Where("id = ?", userID).Update("is_private", isPrivate).Error
}

func (r *UserRepositoryImpl) SetUserActiveStatus(userID uint64, isActive bool) error {
	return r.db.Model(&model.User{}).Where("id = ?", userID).Update("is_active", isActive).Error
}

func (r *UserRepositoryImpl) UpdateLastLogin(userID uint64) error {
	return r.db.Model(&model.User{}).Where("id = ?", userID).Update("last_login_at", time.Now()).Error
}

func (r *UserRepositoryImpl) FindByUsername(ctx context.Context, username string) (*model.User, error) {
    var user model.User
    if err := r.db.WithContext(ctx).Where("username = ?", username).First(&user).Error; err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            return nil, nil
        }
        return nil, err
    }
	fmt.Println("[REPO] RETURNING: ", user);
    return &user, nil
}
