package service

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/KennedySurianto/tpa_web/backend/auth-service/internal/model"
	"github.com/KennedySurianto/tpa_web/backend/shared/gen/auth"
	"github.com/KennedySurianto/tpa_web/backend/shared/gen/user"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/grpc"
)

type AuthServiceImpl struct {
	userClient   user.UserServiceClient
	jwtSecret    []byte
	tokenStorage map[string]*model.TokenInfo // In production, use Redis or database
}

func NewAuthService() AuthService {
	conn, err := grpc.Dial("localhost:50051", grpc.WithInsecure())
	if err != nil {
		log.Fatalf("Failed to connect to user service: %v", err)
	}

	userClient := user.NewUserServiceClient(conn)

	return &AuthServiceImpl{
		userClient:   userClient,
		jwtSecret:    []byte("your-secret-key"),
		tokenStorage: make(map[string]*model.TokenInfo),
	}
}

func (s *AuthServiceImpl) Register(ctx context.Context, req *auth.RegisterRequest) (*auth.AuthResponse, error) {
	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return &auth.AuthResponse{
			Success: false,
			Message: "Failed to hash password",
		}, err
	}

	// Create user via user service
	createUserReq := &user.CreateUserRequest{
		Username:    req.Username,
		Email:       req.Email,
		Password:    string(hashedPassword),
		DisplayName: req.DisplayName,
		Bio:         req.Bio,
		AvatarUrl:   req.AvatarUrl,
		Country:     req.Country,
	}

	userResponse, err := s.userClient.CreateUser(ctx, createUserReq)
	if err != nil {
		return &auth.AuthResponse{
			Success: false,
			Message: "Failed to create user",
			Error:   err.Error(),
		}, err
	}

	// Generate tokens
	accessToken, refreshToken, err := s.generateTokens(userResponse.User.Id, userResponse.User.Email)
	if err != nil {
		return &auth.AuthResponse{
			Success: false,
			Message: "Failed to generate tokens",
		}, err
	}

	// Store refresh token
	s.storeRefreshToken(refreshToken, userResponse.User.Id)

	return &auth.AuthResponse{
		Success:      true,
		Message:      "User registered successfully",
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User: &auth.UserInfo{
			Id:          userResponse.User.Id,
			Username:    userResponse.User.Username,
			Email:       userResponse.User.Email,
			DisplayName: userResponse.User.DisplayName,
			AvatarUrl:   userResponse.User.AvatarUrl,
			IsVerified:  userResponse.User.IsVerified,
			Country:     userResponse.User.Country,
		},
		ExpiresAt: time.Now().Add(24 * time.Hour).Unix(),
	}, nil
}

func (s *AuthServiceImpl) Login(ctx context.Context, req *auth.LoginRequest) (*auth.AuthResponse, error) {
	// Get user from user service
	getUserReq := &user.GetUserRequest{Email: req.Email}
	userData, err := s.userClient.GetUserByEmail(ctx, getUserReq)
	if err != nil {
		return &auth.AuthResponse{
			Success: false,
			Message: "Invalid email or password",
		}, err
	}

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(userData.Password), []byte(req.Password))
	if err != nil {
		return &auth.AuthResponse{
			Success: false,
			Message: "Invalid email or password",
		}, errors.New("invalid credentials")
	}

	// Check if user is active
	if !userData.IsActive {
		return &auth.AuthResponse{
			Success: false,
			Message: "Account is deactivated",
		}, errors.New("account deactivated")
	}

	// Update last login
	_, err = s.userClient.UpdateLastLogin(ctx, &user.UpdateLastLoginRequest{
		UserId: userData.Id,
	})
	if err != nil {
		log.Printf("Failed to update last login: %v", err)
	}

	// Generate tokens
	accessToken, refreshToken, err := s.generateTokens(userData.Id, userData.Email)
	if err != nil {
		return &auth.AuthResponse{
			Success: false,
			Message: "Failed to generate tokens",
		}, err
	}

	// Store refresh token
	s.storeRefreshToken(refreshToken, userData.Id)

	return &auth.AuthResponse{
		Success:      true,
		Message:      "Login successful",
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User: &auth.UserInfo{
			Id:          userData.Id,
			Username:    userData.Username,
			Email:       userData.Email,
			DisplayName: userData.DisplayName,
			AvatarUrl:   userData.AvatarUrl,
			IsVerified:  userData.IsVerified,
			Country:     userData.Country,
		},
		ExpiresAt: time.Now().Add(24 * time.Hour).Unix(),
	}, nil
}

func (s *AuthServiceImpl) Logout(ctx context.Context, req *auth.LogoutRequest) (*auth.LogoutResponse, error) {
	// Remove refresh token from storage
	delete(s.tokenStorage, req.RefreshToken)

	return &auth.LogoutResponse{
		Success: true,
		Message: "Logout successful",
	}, nil
}

func (s *AuthServiceImpl) ValidateToken(ctx context.Context, req *auth.ValidateTokenRequest) (*auth.ValidateTokenResponse, error) {
	token, err := jwt.Parse(req.AccessToken, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return s.jwtSecret, nil
	})

	if err != nil || !token.Valid {
		return &auth.ValidateTokenResponse{
			Valid:   false,
			Message: "Invalid token",
		}, nil
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return &auth.ValidateTokenResponse{
			Valid:   false,
			Message: "Invalid token claims",
		}, nil
	}

	userId, ok := claims["user_id"].(float64)
	if !ok {
		return &auth.ValidateTokenResponse{
			Valid:   false,
			Message: "Invalid user ID in token",
		}, nil
	}

	email, ok := claims["email"].(string)
	if !ok {
		return &auth.ValidateTokenResponse{
			Valid:   false,
			Message: "Invalid email in token",
		}, nil
	}

	return &auth.ValidateTokenResponse{
		Valid:   true,
		Message: "Token is valid",
		UserId:  uint64(userId),
		Email:   email,
	}, nil
}

func (s *AuthServiceImpl) RefreshToken(ctx context.Context, req *auth.RefreshTokenRequest) (*auth.AuthResponse, error) {
	// Check if refresh token exists
	tokenInfo, exists := s.tokenStorage[req.RefreshToken]
	if !exists {
		return &auth.AuthResponse{
			Success: false,
			Message: "Invalid refresh token",
		}, errors.New("invalid refresh token")
	}

	// Check if refresh token is expired
	if time.Now().After(tokenInfo.ExpiresAt) {
		delete(s.tokenStorage, req.RefreshToken)
		return &auth.AuthResponse{
			Success: false,
			Message: "Refresh token expired",
		}, errors.New("refresh token expired")
	}

	// Get user data
	getUserReq := &user.GetUserByIdRequest{Id: tokenInfo.UserId}
	userData, err := s.userClient.GetUserById(ctx, getUserReq)
	if err != nil {
		return &auth.AuthResponse{
			Success: false,
			Message: "User not found",
		}, err
	}

	// Generate new tokens
	accessToken, refreshToken, err := s.generateTokens(userData.Id, userData.Email)
	if err != nil {
		return &auth.AuthResponse{
			Success: false,
			Message: "Failed to generate tokens",
		}, err
	}

	// Remove old refresh token and store new one
	delete(s.tokenStorage, req.RefreshToken)
	s.storeRefreshToken(refreshToken, userData.Id)

	return &auth.AuthResponse{
		Success:      true,
		Message:      "Token refreshed successfully",
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User: &auth.UserInfo{
			Id:          userData.Id,
			Username:    userData.Username,
			Email:       userData.Email,
			DisplayName: userData.DisplayName,
			AvatarUrl:   userData.AvatarUrl,
			IsVerified:  userData.IsVerified,
			Country:     userData.Country,
		},
		ExpiresAt: time.Now().Add(24 * time.Hour).Unix(),
	}, nil
}

func (s *AuthServiceImpl) generateTokens(userId uint64, email string) (string, string, error) {
	// Generate access token (expires in 24 hours)
	accessClaims := jwt.MapClaims{
		"user_id": userId,
		"email":   email,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
		"iat":     time.Now().Unix(),
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessTokenString, err := accessToken.SignedString(s.jwtSecret)
	if err != nil {
		return "", "", err
	}

	// Generate refresh token (random string)
	refreshTokenBytes := make([]byte, 32)
	_, err = rand.Read(refreshTokenBytes)
	if err != nil {
		return "", "", err
	}
	refreshTokenString := base64.URLEncoding.EncodeToString(refreshTokenBytes)

	return accessTokenString, refreshTokenString, nil
}

func (s *AuthServiceImpl) storeRefreshToken(token string, userId uint64) {
	s.tokenStorage[token] = &model.TokenInfo{
		UserId:    userId,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour), // 7 days
	}
}
