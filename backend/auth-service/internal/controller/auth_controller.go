package controller

import (
	"context"

	"github.com/KennedySurianto/tpa_web/backend/auth-service/internal/service"
	"github.com/KennedySurianto/tpa_web/backend/shared/gen/auth"
	"github.com/KennedySurianto/tpa_web/backend/shared/gen/user"
	"golang.org/x/crypto/bcrypt"
)

type AuthController struct {
	auth.UnimplementedAuthServiceServer
	authService service.AuthService
	otpService service.OTPService
	userClient user.UserServiceClient
}

func NewAuthController(authService service.AuthService, otpService service.OTPService, userClient user.UserServiceClient) *AuthController {
	return &AuthController{
		authService: authService,
		otpService:  otpService,
		userClient: userClient,
	}
}

func (c *AuthController) LoginWithGoogle(ctx context.Context, req *auth.LoginWithGoogleRequest) (*auth.AuthResponse, error) {
	return c.authService.LoginWithGoogle(ctx, req)
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

func (c *AuthController) ResetPassword(ctx context.Context, req *auth.ResetPasswordRequest) (*auth.ResetPasswordResponse, error) {
	response, err := c.otpService.VerifyOTP(ctx, &auth.VerifyOTPRequest{
		Email: req.Email,
		Otp:   req.Otp,
	});

	if (err != nil) {
		return nil, err
	}

	if (response != nil && response.Success) {
		// If OTP verification is successful, proceed to reset password
		hashedPassword, hashErr := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
		if hashErr != nil {
			return &auth.ResetPasswordResponse{Success: false, Message: "Failed to hash password"}, hashErr
		}
		userReq := &user.UpdateUserPasswordRequest{
			Email:       req.Email,
			NewPassword: string(hashedPassword),
		}
		_, err := c.userClient.UpdateUserPassword(ctx, userReq)
		if err != nil {
			return &auth.ResetPasswordResponse{Success: false, Message: "Failed to update password"}, err
		}

		return &auth.ResetPasswordResponse{Success: true}, nil
	}

	return &auth.ResetPasswordResponse{Success: false, Message: "OTP verification failed"}, nil
}