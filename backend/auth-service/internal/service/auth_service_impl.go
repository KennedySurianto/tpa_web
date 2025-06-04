package service

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"log"
	"strings"
	"time"

	"github.com/KennedySurianto/tpa_web/backend/auth-service/internal/model"
	"github.com/KennedySurianto/tpa_web/backend/shared/gen/auth"
	"github.com/KennedySurianto/tpa_web/backend/shared/gen/user"
	"golang.org/x/crypto/bcrypt"
)

type AuthServiceImpl struct {
	userClient   user.UserServiceClient
	pasetoMaker  *PasetoMaker
	tokenStorage map[string]*model.TokenInfo
}

func NewAuthService(userClient user.UserServiceClient, pasetoMaker *PasetoMaker) AuthService {
	return &AuthServiceImpl{
		userClient:   userClient,
		pasetoMaker:  pasetoMaker,
		tokenStorage: make(map[string]*model.TokenInfo),
	}
}

func (s *AuthServiceImpl) Register(ctx context.Context, req *auth.RegisterRequest) (*auth.AuthResponse, error) {
	// Input validation
	if err := s.validateRegisterRequest(req); err != nil {
		return &auth.AuthResponse{
			Success: false,
			Message: err.Error(),
		}, err
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Failed to hash password: %v", err)
		return &auth.AuthResponse{
			Success: false,
			Message: "Failed to process password",
		}, err
	}

	// Create user via user service
	createUserReq := &user.CreateUserRequest{
		Username:    strings.TrimSpace(req.Username),
		Email:       strings.TrimSpace(strings.ToLower(req.Email)),
		Password:    string(hashedPassword),
		DisplayName: strings.TrimSpace(req.DisplayName),
		Bio:         strings.TrimSpace(req.Bio),
		AvatarUrl:   strings.TrimSpace(req.AvatarUrl), // Note: Keep as AvatarUrl to match protobuf
		Country:     strings.TrimSpace(req.Country),
	}

	userResponse, err := s.userClient.CreateUser(ctx, createUserReq)
	if err != nil {
		log.Printf("Failed to create user: %v", err)
		// Check for specific errors and provide user-friendly messages
		if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "already exists") {
			if strings.Contains(err.Error(), "email") {
				return &auth.AuthResponse{
					Success: false,
					Message: "Email address is already registered",
				}, err
			}
			if strings.Contains(err.Error(), "username") {
				return &auth.AuthResponse{
					Success: false,
					Message: "Username is already taken",
				}, err
			}
		}
		return &auth.AuthResponse{
			Success: false,
			Message: "Failed to create user account",
			Error:   "Registration failed",
		}, err
	}

	// Validate that user was created successfully
	if userResponse == nil || userResponse.User == nil {
		log.Printf("User creation returned nil response")
		return &auth.AuthResponse{
			Success: false,
			Message: "Failed to create user account",
		}, errors.New("invalid user creation response")
	}

	// Generate tokens
	accessToken, refreshToken, err := s.generateTokens(userResponse.User.Id, userResponse.User.Email, userResponse.User.Username)
	if err != nil {
		log.Printf("Failed to generate tokens: %v", err)
		return &auth.AuthResponse{
			Success: false,
			Message: "Registration completed but failed to generate authentication tokens",
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

func (s *AuthServiceImpl) validateRegisterRequest(req *auth.RegisterRequest) error {
	if req == nil {
		return errors.New("registration request cannot be empty")
	}

	// Validate required fields
	if strings.TrimSpace(req.Username) == "" {
		return errors.New("username is required")
	}

	if strings.TrimSpace(req.Email) == "" {
		return errors.New("email is required")
	}

	if strings.TrimSpace(req.Password) == "" {
		return errors.New("password is required")
	}

	// Validate username format
	username := strings.TrimSpace(req.Username)
	if len(username) < 3 {
		return errors.New("username must be at least 3 characters long")
	}
	if len(username) > 30 {
		return errors.New("username must be less than 30 characters")
	}

	// Basic email validation
	email := strings.TrimSpace(req.Email)
	if !strings.Contains(email, "@") || !strings.Contains(email, ".") {
		return errors.New("invalid email format")
	}

	// Validate password strength
	if len(req.Password) < 8 {
		return errors.New("password must be at least 8 characters long")
	}

	// Validate display name if provided
	if req.DisplayName != "" && len(strings.TrimSpace(req.DisplayName)) > 50 {
		return errors.New("display name must be less than 50 characters")
	}

	// Validate bio if provided
	if req.Bio != "" && len(strings.TrimSpace(req.Bio)) > 500 {
		return errors.New("bio must be less than 500 characters")
	}

	return nil
}

func (s *AuthServiceImpl) Login(ctx context.Context, req *auth.LoginRequest) (*auth.AuthResponse, error) {
	// Input validation
	if req == nil {
		log.Println("[DEBUG] Login request is nil")
		return &auth.AuthResponse{
			Success: false,
			Message: "login request cannot be empty",
		}, errors.New("invalid request")
	}

	log.Printf("[DEBUG] Received login request - Email: '%s', Password: '%s'\n", req.Email, req.Password)

	if strings.TrimSpace(req.Email) == "" || strings.TrimSpace(req.Password) == "" {
		log.Println("[DEBUG] Email or password is empty after trimming")
		return &auth.AuthResponse{
			Success: false,
			Message: "email and password are required",
		}, errors.New("missing credentials")
	}

	// Normalize email
	email := strings.TrimSpace(strings.ToLower(req.Email))
	log.Printf("[DEBUG] Normalized email: '%s'\n", email)

	// Get user from user service
	getUserReq := &user.GetUserRequest{Email: email}
	userData, err := s.userClient.GetUserByEmail(ctx, getUserReq)
	if err != nil {
		log.Printf("[DEBUG] Failed to get user by email: %v\n", err)
		return &auth.AuthResponse{
			Success: false,
			Message: "Invalid email or password",
		}, err
	}

	log.Printf("[DEBUG] Found user: ID=%d, Email=%s, Username=%s, PasswordHash=%s\n",
		userData.Id, userData.Email, userData.Username, userData.Password)

	// Verify password
	err = bcrypt.CompareHashAndPassword([]byte(userData.Password), []byte(req.Password))
	if err != nil {
		log.Printf("[DEBUG] Password verification failed for email %s. Error: %v\n", req.Email, err)
		return &auth.AuthResponse{
			Success: false,
			Message: "Invalid email or password",
		}, errors.New("invalid credentials")
	}

	log.Println("[DEBUG] Password verification successful")

	// Check if user is active
	if !userData.IsActive {
		log.Printf("[DEBUG] User account is deactivated: %s\n", userData.Email)
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
		log.Printf("[DEBUG] Failed to update last login: %v\n", err)
	}

	// Generate tokens
	accessToken, refreshToken, err := s.generateTokens(userData.Id, userData.Email, userData.Username)
	if err != nil {
		log.Printf("[DEBUG] Failed to generate tokens: %v\n", err)
		return &auth.AuthResponse{
			Success: false,
			Message: "Authentication successful but failed to generate tokens",
		}, err
	}

	log.Printf("[DEBUG] Tokens generated successfully. AccessToken: %s\n", accessToken)

	// Store refresh token
	s.storeRefreshToken(refreshToken, userData.Id)
	log.Println("[DEBUG] Refresh token stored")

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
		if req == nil || req.RefreshToken == "" {
			return &auth.LogoutResponse{
				Success: false,
				Message: "refresh token is required",
		}, nil
	}

	// Remove refresh token from storage
	delete(s.tokenStorage, req.RefreshToken)

	return &auth.LogoutResponse{
		Success: true,
		Message: "Logout successful",
	}, nil
}

func (s *AuthServiceImpl) ValidateToken(ctx context.Context, req *auth.ValidateTokenRequest) (*auth.ValidateTokenResponse, error) {
	if req == nil || req.AccessToken == "" {
		return &auth.ValidateTokenResponse{Valid: false, Message: "access token is required"}, nil
	}

	payload, err := s.pasetoMaker.VerifyToken(req.AccessToken)
	if err != nil {
		return &auth.ValidateTokenResponse{Valid: false, Message: "Invalid token"}, nil
	}

	return &auth.ValidateTokenResponse{
		Valid:   true,
		Message: "Token is valid",
		UserId:  payload.UserID,
		Email:   payload.Email,
		Username: payload.Username,
	}, nil
}

func (s *AuthServiceImpl) RefreshToken(ctx context.Context, req *auth.RefreshTokenRequest) (*auth.AuthResponse, error) {
	if req == nil || req.RefreshToken == "" {
		return &auth.AuthResponse{
			Success: false,
			Message: "refresh token is required",
		}, errors.New("missing refresh token")
	}

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
		log.Printf("Failed to get user by ID during token refresh: %v", err)
		return &auth.AuthResponse{
			Success: false,
			Message: "User not found",
		}, err
	}

	// Generate new tokens
	accessToken, refreshToken, err := s.generateTokens(userData.Id, userData.Email, userData.Username)
	if err != nil {
		log.Printf("Failed to generate new tokens: %v", err)
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

func (s *AuthServiceImpl) generateTokens(userId uint64, email, username string) (string, string, error) {
	// Access token: 24 hours
	accessToken, _, err := s.pasetoMaker.CreateToken(userId, email, username, 24*time.Hour)
	if err != nil {
		return "", "", err
	}

	refreshBytes := make([]byte, 32)
	if _, err := rand.Read(refreshBytes); err != nil {
		return "", "", err
	}
	refreshToken := base64.URLEncoding.EncodeToString(refreshBytes)

	return accessToken, refreshToken, nil
}

func (s *AuthServiceImpl) storeRefreshToken(token string, userId uint64) {
	s.tokenStorage[token] = &model.TokenInfo{
		UserId:    userId,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour), // 7 days
	}
}
