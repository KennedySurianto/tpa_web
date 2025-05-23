package controller

import (
	"context"
	"fmt"

	pb "github.com/KennedySurianto/tpa_web/shared/gen/user"
	"github.com/KennedySurianto/tpa_web/user-service/internal/service"
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
	result, err := u.userService.CreateUser(req.Name, req.Email, req.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %v", err)
	}
	return &pb.UserResponse{Message: result}, nil
}

func (u *UserController) GetAllUsers(ctx context.Context, _ *pb.Empty) (*pb.UserListResponse, error) {
	users, err := u.userService.GetAllUsers()
	if err != nil {
		return nil, fmt.Errorf("failed to get users: %v", err)
	}

	var pbUsers []*pb.User
	for _, user := range users {
		pbUsers = append(pbUsers, &pb.User{
			Name:  user.Name,
			Email: user.Email,
		})
	}

	return &pb.UserListResponse{Users: pbUsers}, nil
}

func (u *UserController) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.User, error) {
	user, err := u.userService.GetUserByEmail(req.Email)
	if err != nil {
		return nil, fmt.Errorf("user not found: %v", err)
	}
	return &pb.User{
		Name:  user.Name,
		Email: user.Email,
	}, nil
}

func (u *UserController) UpdateUser(ctx context.Context, req *pb.UpdateUserRequest) (*pb.UserResponse, error) {
	err := u.userService.UpdateUser(req.Email, req.Name, req.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to update user: %v", err)
	}
	return &pb.UserResponse{Message: "User updated successfully"}, nil
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

	return &pb.User{
		Name:  user.Name,
		Email: user.Email,
	}, nil
}