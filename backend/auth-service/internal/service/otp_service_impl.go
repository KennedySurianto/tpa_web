package service

import (
	"context"
	"fmt"
	"math/rand"
	"net/smtp"
	"os"
	"time"

	"github.com/KennedySurianto/tpa_web/backend/auth-service/internal/memcache"
	"github.com/KennedySurianto/tpa_web/backend/shared/gen/auth"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type OTPServiceImpl struct {
	Cache *memcache.Client
}

func NewOTPService(Cache *memcache.Client) *OTPServiceImpl {
	return &OTPServiceImpl{
		Cache: Cache,
	}
}

func generateCode(n int) string {
	rand.Seed(time.Now().UnixNano())
	digits := "0123456789"
	code := make([]byte, n)
	for i := range code {
		code[i] = digits[rand.Intn(len(digits))]
	}
	return string(code)
}

func (s *OTPServiceImpl) SendOTP(ctx context.Context, req *auth.SendOTPRequest) (*auth.SendOTPResponse, error) {
	limited, err := s.Cache.IsRateLimited(req.Email)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Memcached error: %v", err)
	}
	if limited {
		return nil, status.Error(codes.ResourceExhausted, "Wait before requesting another OTP")
	}

	code := generateCode(6)
	if err := s.Cache.SetOTP(req.Email, code); err != nil {
		return nil, status.Error(codes.Internal, "Failed to store OTP")
	}
	if err := s.Cache.SetRateLimit(req.Email); err != nil {
		return nil, status.Error(codes.Internal, "Failed to set rate limit")
	}

	// Replace with actual email logic
	fmt.Printf("[INFO] Code has been generated for %s: %s\n", req.Email, code)
	// Email sending config — ideally from environment variables
	smtpUser := os.Getenv("SMTP_USER")
	smtpPass := os.Getenv("SMTP_PASS")
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")

	if smtpUser == "" || smtpPass == "" || smtpHost == "" || smtpPort == "" {
		return nil, status.Error(codes.Internal, "SMTP configuration is incomplete")
	}

	subject := "Your OTP Code"
	body := fmt.Sprintf("Your OTP code is: %s\nIt is valid for 10 minutes.", code)

	fmt.Println("[INFO] Sending OTP email to", req.Email)
	err = sendEmail(req.Email, subject, body, smtpHost, smtpPort, smtpUser, smtpPass)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Failed to send OTP email: %v", err)
	}
	fmt.Println("[INFO] OTP email sent successfully to", req.Email)

	return &auth.SendOTPResponse{Message: "OTP sent successfully"}, nil
}

func (s *OTPServiceImpl) VerifyOTP(ctx context.Context, req *auth.VerifyOTPRequest) (*auth.VerifyOTPResponse, error) {
	stored, err := s.Cache.GetOTP(req.Email)
	if err != nil {
		return &auth.VerifyOTPResponse{Success: false, Message: "OTP expired or not found"}, nil
	}

	if req.Otp != stored {
		return &auth.VerifyOTPResponse{Success: false, Message: "Incorrect OTP"}, nil
	}

	return &auth.VerifyOTPResponse{Success: true, Message: "OTP verified"}, nil
}

func sendEmail(to, subject, body, smtpHost, smtpPort, smtpUser, smtpPass string) error {
	from := smtpUser
	msg := "From: " + from + "\n" +
		"To: " + to + "\n" +
		"Subject: " + subject + "\n\n" +
		body

	fmt.Println("smtpHost:", smtpHost)
	fmt.Println("smtpPort:", smtpPort)
	fmt.Println("smtpUser:", smtpUser)
	fmt.Println("smtpPass:", smtpPass)

	fmt.Println("[INFO sendEmail()] Preparing to send email to", to)
	auth := smtp.PlainAuth("", smtpUser, smtpPass, smtpHost)

	fmt.Println("[INFO sendEmail()] Sending email to", to)
	err := smtp.SendMail(smtpHost+":"+smtpPort, auth, from, []string{to}, []byte(msg))
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}
	fmt.Println("[INFO sendEmail()] Email sent successfully to", to)

	return nil
}