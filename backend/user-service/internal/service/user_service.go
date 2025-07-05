package service

import (
	"context"

	pb "github.com/KennedySurianto/tpa_web/backend/shared/gen/user"
	"github.com/KennedySurianto/tpa_web/backend/user-service/internal/model"
)

type UserService interface {
	CreateUser(req *pb.CreateUserRequest) (*model.User, error)
	GetAllUsers() ([]model.User, error)
	GetUserByEmail(email string) (*model.User, error)
	UpdateUser(id uint32, username, displayName, bio string, avatar []byte, IsVerified, isPrivate, IsActive bool, country string, allowDuet, allowStitch, allowDownload, allowComments, newFollowerNotification, mentionNofitication, messageNotification bool, chatRestriction, likeTabVisibility string) error
	DeleteUser(email string) error
	GetUserById(id uint) (*model.User, error)
	UpdateUserPassword(email string, newPassword string) error
	UpdateLastLogin(userID uint64) error
	GetUserByUsername(ctx context.Context, username string) (*model.User, error)
}

