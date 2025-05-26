package controller

import (
	"context"
	"fmt"
	"time"

	pb "github.com/KennedySurianto/tpa_web/backend/shared/gen/user"
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
	result, err := u.userService.CreateUser(req.Username, req.Email, req.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %v", err)
	}
	fmt.Println("User created successfully:", result)
	return &pb.UserResponse{Message: result}, nil
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

	return &pb.UserListResponse{Users: pbUsers}, nil
}

func (u *UserController) GetUserByEmail(ctx context.Context, req *pb.GetUserRequest) (*pb.User, error) {
	user, err := u.userService.GetUserByEmail(req.Email)
	if err != nil {
		return nil, fmt.Errorf("user not found: %v", err)
	}
	return convertModelToPbUser(user), nil
}

func (u *UserController) UpdateUser(ctx context.Context, req *pb.UpdateUserRequest) (*pb.UserResponse, error) {
	err := u.userService.UpdateUser(req.Email, req.Username, req.Password)
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

	return convertModelToPbUser(user), nil
}

// Helper function to convert model User to protobuf User
func convertModelToPbUser(user interface{}) *pb.User {
	// Assuming user is your model.User struct
	// You'll need to adjust this based on your actual model structure
	u := user.(struct {
		ID               uint      `json:"id"`
		Username         string    `json:"username"`
		Email            string    `json:"email"`
		DisplayName      string    `json:"display_name"`
		Bio              string    `json:"bio"`
		AvatarURL        string    `json:"avatar_url"`
		IsVerified       bool      `json:"is_verified"`
		IsPrivate        bool      `json:"is_private"`
		IsActive         bool      `json:"is_active"`
		LastLoginAt      time.Time `json:"last_login_at"`
		Country          string    `json:"country"`
		AllowDuet        bool      `json:"allow_duet"`
		AllowStitch      bool      `json:"allow_stitch"`
		AllowDownload    bool      `json:"allow_download"`
		AllowComments    bool      `json:"allow_comments"`
		CreatedAt        time.Time `json:"created_at"`
		UpdatedAt        time.Time `json:"updated_at"`
	})

	return &pb.User{
		Id:               uint64(u.ID),
		Username:         u.Username,
		Email:            u.Email,
		DisplayName:      u.DisplayName,
		Bio:              u.Bio,
		AvatarUrl:        u.AvatarURL,
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

// Additional methods for enhanced user operations

func (u *UserController) UpdateUserProfile(ctx context.Context, req *pb.UpdateUserProfileRequest) (*pb.UserResponse, error) {
	err := u.userService.UpdateUserProfile(
		req.UserId,
		req.DisplayName,
		req.Bio,
		req.AvatarUrl,
		req.Country,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update user profile: %v", err)
	}
	return &pb.UserResponse{Message: "User profile updated successfully"}, nil
}

func (u *UserController) UpdateUserPreferences(ctx context.Context, req *pb.UpdateUserPreferencesRequest) (*pb.UserResponse, error) {
	err := u.userService.UpdateUserPreferences(
		req.UserId,
		req.AllowDuet,
		req.AllowStitch,
		req.AllowDownload,
		req.AllowComments,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to update user preferences: %v", err)
	}
	return &pb.UserResponse{Message: "User preferences updated successfully"}, nil
}

func (u *UserController) SetUserPrivacyStatus(ctx context.Context, req *pb.SetUserPrivacyStatusRequest) (*pb.UserResponse, error) {
	err := u.userService.SetUserPrivacyStatus(req.UserId, req.IsPrivate)
	if err != nil {
		return nil, fmt.Errorf("failed to update user privacy status: %v", err)
	}
	return &pb.UserResponse{Message: "User privacy status updated successfully"}, nil
}

func (u *UserController) SetUserActiveStatus(ctx context.Context, req *pb.SetUserActiveStatusRequest) (*pb.UserResponse, error) {
	err := u.userService.SetUserActiveStatus(req.UserId, req.IsActive)
	if err != nil {
		return nil, fmt.Errorf("failed to update user active status: %v", err)
	}
	return &pb.UserResponse{Message: "User active status updated successfully"}, nil
}

func (u *UserController) UpdateLastLogin(ctx context.Context, req *pb.UpdateLastLoginRequest) (*pb.UserResponse, error) {
	err := u.userService.UpdateLastLogin(req.UserId)
	if err != nil {
		return nil, fmt.Errorf("failed to update last login: %v", err)
	}
	return &pb.UserResponse{Message: "Last login updated successfully"}, nil
}