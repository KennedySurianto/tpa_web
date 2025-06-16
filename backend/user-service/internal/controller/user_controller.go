package controller

import (
	"context"
	"fmt"

	pb "github.com/KennedySurianto/tpa_web/backend/shared/gen/user"
	"github.com/KennedySurianto/tpa_web/backend/user-service/internal/model"
	"github.com/KennedySurianto/tpa_web/backend/user-service/internal/service"
)

type UserController struct {
	pb.UnimplementedUserServiceServer
	userService service.UserService
}

func NewUserController(userService service.UserService) *UserController {
	return &UserController{
		userService: userService,
	}
}

func (u *UserController) CreateUser(ctx context.Context, req *pb.CreateUserRequest) (*pb.UserResponse, error) {
	fmt.Println("Received CreateUser request:", req)

	createdUser, err := u.userService.CreateUser(req)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %v", err)
	}

	return &pb.UserResponse{
		Message: "User created successfully",
		User: &pb.User{
			Id:          uint64(createdUser.ID),
			Username:    createdUser.Username,
			Email:       createdUser.Email,
			Password:    createdUser.Password,
			DisplayName: createdUser.DisplayName,
			Bio:         createdUser.Bio,
			Avatar:      createdUser.Avatar,
			IsVerified:  createdUser.IsVerified,
			IsPrivate:   createdUser.IsPrivate,
			IsActive:    createdUser.IsActive,
			LastLoginAt: createdUser.LastLoginAt.Unix(),
			Country:     createdUser.Country,
			AllowDuet:   createdUser.AllowDuet,
			AllowStitch: createdUser.AllowStitch,
			AllowDownload: createdUser.AllowDownload,
			AllowComments: createdUser.AllowComments,
			CreatedAt:     createdUser.CreatedAt.Unix(),
			UpdatedAt:     createdUser.UpdatedAt.Unix(),
		},
	}, nil
}

func (u *UserController) GetAllUsers(ctx context.Context, _ *pb.Empty) (*pb.UserListResponse, error) {
	users, err := u.userService.GetAllUsers()
	if err != nil {
		return nil, fmt.Errorf("failed to get users: %v", err)
	}

	var pbUsers []*pb.User
	for _, user := range users {
		pbUser := convertModelToPbUser(user)
		pbUsers = append(pbUsers, pbUser)
	}

	return &pb.UserListResponse{
		Users:      pbUsers,
		TotalCount: int32(len(pbUsers)),
		Page:       1,           // static/default value
		PageSize:   int32(len(pbUsers)), // since returning all
	}, nil
}

func (u *UserController) GetUserByEmail(ctx context.Context, req *pb.GetUserRequest) (*pb.User, error) {
	user, err := u.userService.GetUserByEmail(req.Email)
	if err != nil {
		return nil, fmt.Errorf("user not found: %v", err)
	}
	return convertModelToPbUser(*user), nil
}

func (u *UserController) UpdateUserPassword(ctx context.Context, req *pb.UpdateUserPasswordRequest) (*pb.UserResponse, error) {
	err := u.userService.UpdateUserPassword(req.Email, req.NewPassword);
	if err != nil {
		return nil, fmt.Errorf("failed to update user password: %v", err)
	}
	return &pb.UserResponse{Message: "User password updated successfully"}, nil
}

func (u *UserController) DeleteUser(ctx context.Context, req *pb.DeleteUserRequest) (*pb.UserResponse, error) {
	err := u.userService.DeleteUser(req.Email)
	if err != nil {
		return nil, fmt.Errorf("failed to delete user: %v", err)
	}
	return &pb.UserResponse{Message: "User deleted successfully"}, nil
}

func (u *UserController) GetUserById(ctx context.Context, req *pb.GetUserByIdRequest) (*pb.User, error) {
	user, err := u.userService.GetUserById(uint(req.Id))
	if err != nil {
		return nil, fmt.Errorf("user not found: %v", err)
	}

	return convertModelToPbUser(*user), nil
}

func (u *UserController) GetUserByUsername(ctx context.Context, req *pb.GetUserByUsernameRequest) (*pb.User, error) {
    fmt.Println("[CONT 1] GOT REQ: ", req);
	user, err := u.userService.GetUserByUsername(ctx, req.Username)
	if err != nil {
		return nil, err
	}
	fmt.Println("[CONT 2] GOT USER, RETURNING: ", user);

	return &pb.User{
        Id:            uint64(user.ID),
        Username:      user.Username,
        Email:         user.Email,
        Password:      user.Password,
        DisplayName:   user.DisplayName,
        Bio:           user.Bio,
        Avatar:        user.Avatar,
        IsVerified:    user.IsVerified,
        IsPrivate:     user.IsPrivate,
        IsActive:      user.IsActive,
        LastLoginAt:   user.LastLoginAt.Unix(),
        Country:       user.Country,
        AllowDuet:     user.AllowDuet,
        AllowStitch:   user.AllowStitch,
        AllowDownload: user.AllowDownload,
        AllowComments: user.AllowComments,
        CreatedAt:     user.CreatedAt.Unix(),
        UpdatedAt:     user.UpdatedAt.Unix(),
    }, nil
}

func convertModelToPbUser(u model.User) *pb.User {
	return &pb.User{
		Id:               uint64(u.ID),
		Username:         u.Username,
		Email:            u.Email,
		Password: 		  u.Password,
		DisplayName:      u.DisplayName,
		Bio:              u.Bio,
		Avatar:           u.Avatar,
		IsVerified:       u.IsVerified,
		IsPrivate:        u.IsPrivate,
		IsActive:         u.IsActive,
		LastLoginAt:      u.LastLoginAt.Unix(), // Convert to Unix timestamp
		Country:          u.Country,
		AllowDuet:        u.AllowDuet,
		AllowStitch:      u.AllowStitch,
		AllowDownload:    u.AllowDownload,
		AllowComments:    u.AllowComments,
		CreatedAt:        u.CreatedAt.Unix(),
		UpdatedAt:        u.UpdatedAt.Unix(),
	}
}

func (u *UserController) UpdateUser(ctx context.Context, req *pb.UpdateUserRequest) (*pb.UserResponse, error) {
	err := u.userService.UpdateUser(
		req.Id,
		req.Username,
		req.DisplayName,
		req.Bio,
		req.Avatar,
		req.IsVerified,
		req.IsPrivate,
		req.IsActive,
		req.Country,
		req.AllowDuet,
		req.AllowStitch,
		req.AllowDownload,
		req.AllowComments,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update user profile: %v", err)
	}
	return &pb.UserResponse{Message: "User profile updated successfully"}, nil
}

func (u *UserController) UpdateLastLogin(ctx context.Context, req *pb.UpdateLastLoginRequest) (*pb.UserResponse, error) {
	err := u.userService.UpdateLastLogin(req.UserId)
	if err != nil {
		return nil, fmt.Errorf("failed to update last login: %v", err)
	}
	return &pb.UserResponse{Message: "Last login updated successfully"}, nil
}