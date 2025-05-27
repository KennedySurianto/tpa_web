package controller

import (
	"context"

	"github.com/KennedySurianto/tpa_web/backend/auth-service/internal/service"
	"github.com/KennedySurianto/tpa_web/backend/shared/gen/auth"
)

type AuthController struct {
	auth.UnimplementedAuthServiceServer
	authService service.AuthService
	otpService service.OTPService
}

func NewAuthController(authService service.AuthService, otpService service.OTPService) *AuthController {
	return &AuthController{
		authService: authService,
		otpService:  otpService,
	}
}

func (c *AuthController) Register(ctx context.Context, req *auth.RegisterRequest) (*auth.AuthResponse, error) {
	return c.authService.Register(ctx, req)
}

func (c *AuthController) Login(ctx context.Context, req *auth.LoginRequest) (*auth.AuthResponse, error) {
	return c.authService.Login(ctx, req)
}

func (c *AuthController) Logout(ctx context.Context, req *auth.LogoutRequest) (*auth.LogoutResponse, error) {
	return c.authService.Logout(ctx, req)
}

func (c *AuthController) ValidateToken(ctx context.Context, req *auth.ValidateTokenRequest) (*auth.ValidateTokenResponse, error) {
	return c.authService.ValidateToken(ctx, req)
}

func (c *AuthController) RefreshToken(ctx context.Context, req *auth.RefreshTokenRequest) (*auth.AuthResponse, error) {
	return c.authService.RefreshToken(ctx, req)
}

func (c *AuthController) SendOTP(ctx context.Context, req *auth.SendOTPRequest) (*auth.SendOTPResponse, error) {
	return c.otpService.SendOTP(ctx, req)
}

func (c *AuthController) VerifyOTP(ctx context.Context, req *auth.VerifyOTPRequest) (*auth.VerifyOTPResponse, error) {
	return c.otpService.VerifyOTP(ctx, req)
}