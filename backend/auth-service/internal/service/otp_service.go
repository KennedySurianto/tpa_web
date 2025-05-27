package service

import (
	"context"
	"github.com/KennedySurianto/tpa_web/backend/shared/gen/auth"
)

type OTPService interface {
	SendOTP(ctx context.Context, req *auth.SendOTPRequest) (*auth.SendOTPResponse, error)
	VerifyOTP(ctx context.Context, req *auth.VerifyOTPRequest) (*auth.VerifyOTPResponse, error)
}