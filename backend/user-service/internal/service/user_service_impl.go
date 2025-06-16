package service

import (
	"context"
	"errors"

	pb "github.com/KennedySurianto/tpa_web/backend/shared/gen/user"
	"github.com/KennedySurianto/tpa_web/backend/user-service/internal/model"
	"github.com/KennedySurianto/tpa_web/backend/user-service/internal/repository"
)

type UserServiceImpl struct {
	userRepo repository.UserRepository
}

func NewUserService(userRepo repository.UserRepository) *UserServiceImpl {
	return &UserServiceImpl{
		userRepo: userRepo,
	}
}

func (u *UserServiceImpl) CreateUser(req *pb.CreateUserRequest) (*model.User, error) {
	user := &model.User{
		Username:    req.Username,
		Email:       req.Email,
		Password:    req.Password,
		DisplayName: req.DisplayName,
		Bio:         req.Bio,
		Avatar:  	 req.Avatar,
		Country:     req.Country,
	}

	err := u.userRepo.CreateUser(user)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (u *UserServiceImpl) GetAllUsers() ([]model.User, error) {
	return u.userRepo.GetAllUsers()
}

func (u *UserServiceImpl) GetUserByEmail(email string) (*model.User, error) {
	return u.userRepo.GetUserByEmail(email)
}

func (u *UserServiceImpl) UpdateUserPassword(email string, newPassword string) error {
	return u.userRepo.UpdateUserPassword(email, newPassword);
}

func (u *UserServiceImpl) UpdateUser(id uint32, username, displayName, bio string, avatar []byte, IsVerified, isPrivate, IsActive bool, country string, allowDuet, allowStitch, allowDownload, allowComments bool) error {
	updatedUser := &model.User{
		Username:    username,
		DisplayName: displayName,
		Bio:         bio,
		Avatar:      avatar,
		IsVerified:  IsVerified,
		IsPrivate:   isPrivate,
		IsActive:    IsActive,
		Country:     country,
		AllowDuet:   allowDuet,
		AllowStitch: allowStitch,
		AllowDownload: allowDownload,
		AllowComments: allowComments,
	}
	updatedUser.ID = uint(id)
	return u.userRepo.UpdateUser(updatedUser)
}

func (u *UserServiceImpl) DeleteUser(email string) error {
	return u.userRepo.DeleteUser(email)
}

func (u *UserServiceImpl) GetUserById(id uint) (*model.User, error) {
	return u.userRepo.GetUserById(id)
}

func (u *UserServiceImpl) UpdateLastLogin(userID uint64) error {
	return u.userRepo.UpdateLastLogin(userID)
}

func (u *UserServiceImpl) GetUserByUsername(ctx context.Context, username string) (*model.User, error) {
    user, err := u.userRepo.FindByUsername(ctx, username)
    if err != nil {
        return nil, err
    }

    if user == nil {
        return nil, errors.New("user not found")
    }

    return user, nil
}