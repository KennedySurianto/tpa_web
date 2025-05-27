package service

import (
	"context"
	"github.com/KennedySurianto/tpa_web/backend/shared/gen/auth"
)

type AuthService interface {
	Register(ctx context.Context, req *auth.RegisterRequest) (*auth.AuthResponse, error)
	Login(ctx context.Context, req *auth.LoginRequest) (*auth.AuthResponse, error)
	Logout(ctx context.Context, req *auth.LogoutRequest) (*auth.LogoutResponse, error)
	ValidateToken(ctx context.Context, req *auth.ValidateTokenRequest) (*auth.ValidateTokenResponse, error)
	RefreshToken(ctx context.Context, req *auth.RefreshTokenRequest) (*auth.AuthResponse, error)
	generateTokens(userId uint64, email string) (string, string, error)
	storeRefreshToken(token string, userId uint64)
}