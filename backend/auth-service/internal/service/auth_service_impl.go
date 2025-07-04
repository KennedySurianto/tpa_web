package service

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"log"
	mathrand "math/rand"
	"os"
	"strings"
	"time"

	"google.golang.org/api/idtoken"
	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/KennedySurianto/tpa_web/backend/auth-service/internal/model"
	"github.com/KennedySurianto/tpa_web/backend/middleware"
	"github.com/KennedySurianto/tpa_web/backend/shared/gen/auth"
	"github.com/KennedySurianto/tpa_web/backend/shared/gen/user"
	"golang.org/x/crypto/bcrypt"
)

type AuthServiceImpl struct {
	userClient   user.UserServiceClient
	pasetoMaker  *middleware.PasetoMaker
	tokenStorage map[string]*model.TokenInfo
}

func NewAuthService(userClient user.UserServiceClient, pasetoMaker *middleware.PasetoMaker) AuthService {
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
		Username:    req.Username,
		Email:       strings.TrimSpace(strings.ToLower(req.Email)),
		Password:    string(hashedPassword),
		DisplayName: strings.TrimSpace(req.DisplayName),
		Bio:         strings.TrimSpace(req.Bio),
		Avatar:      req.Avatar, // Note: Keep as AvatarUrl to match protobuf
		Country:     strings.TrimSpace(req.Country),
		IsPrivate:   req.IsPrivate,
		Preferences: &user.UserPreferences{
			AllowDuet: req.Preferences.AllowDuet,
			AllowStitch: req.Preferences.AllowStitch,
			AllowDownload: req.Preferences.AllowDownload,
			AllowComments: req.Preferences.AllowComments,
		},
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

	SendWelcomeEmail(userResponse.User.Email, userResponse.User.Username)

	return &auth.AuthResponse{
		Success:      true,
		Message:      "User registered successfully",
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User: &auth.User{
			Id:          userResponse.User.Id,
			Username:    userResponse.User.Username,
			Email:       userResponse.User.Email,
			DisplayName: userResponse.User.DisplayName,
			Bio: 	   userResponse.User.Bio,
			Avatar:      userResponse.User.Avatar,
			IsVerified:  userResponse.User.IsVerified,
			IsPrivate:  userResponse.User.IsPrivate,
			IsActive:   userResponse.User.IsActive,
			LastLoginAt: userResponse.User.LastLoginAt, // Unix timestamp
			Country:     userResponse.User.Country,
			AllowDuet:  userResponse.User.AllowDuet,
			AllowStitch: userResponse.User.AllowStitch,
			AllowDownload: userResponse.User.AllowDownload,
			AllowComments: userResponse.User.AllowComments,
			CreatedAt:  userResponse.User.CreatedAt, // Unix timestamp
			UpdatedAt:  userResponse.User.UpdatedAt, // Unix timestamp
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

	SendLoginNotificationEmail(userData.Email, userData.Username, time.Unix(userData.LastLoginAt, 0))

	return &auth.AuthResponse{
		Success:      true,
		Message:      "Login successful",
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User: &auth.User{
			Id:          userData.Id,
			Username:    userData.Username,
			Email:       userData.Email,
			DisplayName: userData.DisplayName,
			Bio: 	   	 userData.Bio,
			Avatar:      userData.Avatar,
			IsVerified:  userData.IsVerified,
			IsPrivate:  userData.IsPrivate,
			IsActive:   userData.IsActive,
			LastLoginAt: userData.LastLoginAt, // Unix timestamp
			Country:     userData.Country,
			AllowDuet:  userData.AllowDuet,
			AllowStitch: userData.AllowStitch,
			AllowDownload: userData.AllowDownload,
			AllowComments: userData.AllowComments,
			CreatedAt:  userData.CreatedAt, // Unix timestamp
			UpdatedAt:  userData.UpdatedAt, // Unix timestamp
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
		User: &auth.User{
			Id:          userData.Id,
			Username:    userData.Username,
			Email:       userData.Email,
			DisplayName: userData.DisplayName,
			Bio: 	   	 userData.Bio,
			Avatar:      userData.Avatar,
			IsVerified:  userData.IsVerified,
			IsPrivate:  userData.IsPrivate,
			IsActive:   userData.IsActive,
			LastLoginAt: userData.LastLoginAt, // Unix timestamp
			Country:     userData.Country,
			AllowDuet:  userData.AllowDuet,
			AllowStitch: userData.AllowStitch,
			AllowDownload: userData.AllowDownload,
			AllowComments: userData.AllowComments,
			CreatedAt:  userData.CreatedAt, // Unix timestamp
			UpdatedAt:  userData.UpdatedAt, // Unix timestamp
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

func (s *AuthServiceImpl) LoginWithGoogle(ctx context.Context, req *auth.LoginWithGoogleRequest) (*auth.AuthResponse, error) {
	// IMPORTANT: Set this environment variable in your deployment
	googleClientID := os.Getenv("GOOGLE_CLIENT_ID")
	if googleClientID == "" {
		log.Println("ERROR: GOOGLE_CLIENT_ID environment variable not set")
		return &auth.AuthResponse{Success: false, Message: "Server configuration error"}, errors.New("missing google client id")
	}

	// 1. Validate the ID token using Google's library
	payload, err := idtoken.Validate(ctx, req.IdToken, googleClientID)
	if err != nil {
		log.Printf("Google ID token validation failed: %v", err)
		return &auth.AuthResponse{Success: false, Message: "Invalid or expired Google session. Please sign in again."}, err
	}

	email, ok := payload.Claims["email"].(string)
	if !ok || email == "" {
		return &auth.AuthResponse{Success: false, Message: "Email not found in Google token"}, errors.New("email missing from token")
	}
	email = strings.ToLower(strings.TrimSpace(email))

	// 2. Check if the user already exists in the database
	existingUser, err := s.userClient.GetUserByEmail(ctx, &user.GetUserRequest{Email: email})

	// --- Case 1: User exists, log them in ---
	if err == nil && existingUser != nil {
		log.Printf("Existing user logged in with Google: %s", email)
		// Update last login time
		_, updateErr := s.userClient.UpdateLastLogin(ctx, &user.UpdateLastLoginRequest{UserId: existingUser.Id})
		if updateErr != nil {
			log.Printf("Failed to update last login for user %d: %v", existingUser.Id, updateErr)
		}

		// Generate session tokens for the existing user
		accessToken, refreshToken, tokenErr := s.generateTokens(existingUser.Id, existingUser.Email, existingUser.Username)
		if tokenErr != nil {
			return &auth.AuthResponse{Success: false, Message: "Failed to create session after login"}, tokenErr
		}
		s.storeRefreshToken(refreshToken, existingUser.Id)

		accessExpiresAt := time.Now().Add(24 * time.Hour)
		refreshExpiresAt := time.Now().Add(7 * 24 * time.Hour)

		return &auth.AuthResponse{
			Success:          true,
			Message:          "Login successful",
			AccessToken:      accessToken,
			RefreshToken:     refreshToken,
			User:             s.mapUserToAuthUser(existingUser),
			ExpiresAt:        accessExpiresAt.Unix(),
			RefreshExpiresAt: refreshExpiresAt.Unix(),
			TokenInfo: &auth.TokenInfo{
				TokenType: "Bearer",
				ExpiresIn: int64(time.Until(accessExpiresAt).Seconds()),
				IssuedAt:  timestamppb.Now(),
				DeviceId:  req.DeviceInfo,
			},
		}, nil
	}

	// --- Case 2: User does not exist, create a new account ---
	log.Printf("User with email %s not found. Creating a new user via Google Sign-Up.", email)

	// Extract user info from the Google token payload
	name, _ := payload.Claims["name"].(string)
	// picture, _ := payload.Claims["picture"].(string) // This is a URL, but the proto expects bytes.

	// Create a unique username from the email prefix
	baseUsername := strings.Split(email, "@")[0]
	username := baseUsername
	for i := 0; i < 5; i++ {
		_, userErr := s.userClient.GetUserByUsername(ctx, &user.GetUserByUsernameRequest{Username: username})
		if userErr != nil {
			break
		}
		username = fmt.Sprintf("%s%d", baseUsername, mathrand.Intn(9000)+1000)
		if i == 4 {
			return &auth.AuthResponse{Success: false, Message: "Could not generate a unique username."}, errors.New("username generation failed")
		}
	}

	randomPasswordBytes := make([]byte, 16)
	if _, err := rand.Read(randomPasswordBytes); err != nil {
		return &auth.AuthResponse{Success: false, Message: "Failed to generate internal credentials"}, err
	}
	hashedPassword, err := bcrypt.GenerateFromPassword(randomPasswordBytes, bcrypt.DefaultCost)
	if err != nil {
		return &auth.AuthResponse{Success: false, Message: "Failed to process internal credentials"}, err
	}

	// Create the new user in the database
	createUserReq := &user.CreateUserRequest{
		Username:    username,
		Email:       email,
		Password:    string(hashedPassword),
		DisplayName: name,
		IsPrivate:  false,
		Preferences: &user.UserPreferences{ // Set default preferences
			AllowDuet:             true,
			AllowStitch:           true,
			AllowDownload:         true,
			AllowComments:         true,
		},
	}

	newUserResponse, err := s.userClient.CreateUser(ctx, createUserReq)
	if err != nil {
		log.Printf("Failed to create user from Google login: %v", err)
		return &auth.AuthResponse{Success: false, Message: "Failed to register your account. The email might already be in use with a different method."}, err
	}

	accessToken, refreshToken, err := s.generateTokens(newUserResponse.User.Id, newUserResponse.User.Email, newUserResponse.User.Username)
	if err != nil {
		return &auth.AuthResponse{Success: false, Message: "Account created but failed to create a session."}, err
	}
	s.storeRefreshToken(refreshToken, newUserResponse.User.Id)

	SendWelcomeEmail(newUserResponse.User.Email, newUserResponse.User.Username)

	accessExpiresAt := time.Now().Add(24 * time.Hour)
	refreshExpiresAt := time.Now().Add(7 * 24 * time.Hour)

	return &auth.AuthResponse{
		Success:          true,
		Message:          "Registration successful",
		AccessToken:      accessToken,
		RefreshToken:     refreshToken,
		User:             s.mapUserToAuthUser(newUserResponse.User),
		ExpiresAt:        accessExpiresAt.Unix(),
		RefreshExpiresAt: refreshExpiresAt.Unix(),
		TokenInfo: &auth.TokenInfo{
			TokenType: "Bearer",
			ExpiresIn: int64(time.Until(accessExpiresAt).Seconds()),
			IssuedAt:  timestamppb.Now(),
			DeviceId:  req.DeviceInfo,
		},
	}, nil
}

func (s *AuthServiceImpl) mapUserToAuthUser(u *user.User) *auth.User {
	if u == nil {
		return nil
	}
	// The user.User from user-service client needs to be mapped to auth.User for the response
	// Note: The `Avatar` field in `auth.User` is `bytes`. We assume `user.User` from the client also has `bytes`.
	return &auth.User{
		Id:            u.Id,
		Username:      u.Username,
		Email:         u.Email,
		DisplayName:   u.DisplayName,
		Bio:           u.Bio,
		Avatar:        u.Avatar, // Assuming u.Avatar is []byte
		IsVerified:    u.IsVerified,
		IsPrivate:     u.IsPrivate,
		IsActive:      u.IsActive,
		LastLoginAt:   u.LastLoginAt,
		Country:       u.Country,
		AllowDuet:     u.AllowDuet,
		AllowStitch:   u.AllowStitch,
		AllowDownload: u.AllowDownload,
		AllowComments: u.AllowComments,
		CreatedAt:     u.CreatedAt,
		UpdatedAt:     u.UpdatedAt,
	}
}