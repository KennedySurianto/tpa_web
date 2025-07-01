package middleware

import (
	"crypto/ed25519"
	"encoding/base64"
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/o1egl/paseto"
)

type PasetoPayload struct {
	UserID    uint64    `json:"user_id"`
	Email     string    `json:"email"`
	Username  string    `json:"username"`
	IssuedAt  time.Time `json:"issued_at"`
	ExpiresAt time.Time `json:"expires_at"`
}

type PasetoMaker struct {
	paseto     *paseto.V2
	privateKey ed25519.PrivateKey
	publicKey  ed25519.PublicKey
}

func NewPasetoMaker() (*PasetoMaker, error) {
	privateKeyBase64 := os.Getenv("PASETO_PRIVATE_KEY")
	if privateKeyBase64 == "" {
		return nil, errors.New("PASETO_PRIVATE_KEY is not set")
	}

	privateKeyBytes, err := base64.StdEncoding.DecodeString(privateKeyBase64)
	if err != nil {
		return nil, fmt.Errorf("invalid base64 private key: %w", err)
	}

	if len(privateKeyBytes) != ed25519.PrivateKeySize {
		return nil, errors.New("invalid ed25519 private key size")
	}

	privateKey := ed25519.PrivateKey(privateKeyBytes)
	publicKey := privateKey.Public().(ed25519.PublicKey)

	return &PasetoMaker{
		paseto:     paseto.NewV2(),
		privateKey: privateKey,
		publicKey:  publicKey,
	}, nil
}

func (m *PasetoMaker) CreateToken(userID uint64, email, username string, duration time.Duration) (string, *PasetoPayload, error) {
	payload := &PasetoPayload{
		UserID:    userID,
		Email:     email,
		Username:  username,
		IssuedAt:  time.Now(),
		ExpiresAt: time.Now().Add(duration),
	}

	token, err := m.paseto.Sign(m.privateKey, payload, nil)
	return token, payload, err
}

func (m *PasetoMaker) VerifyToken(token string) (*PasetoPayload, error) {
	var payload PasetoPayload
	err := m.paseto.Verify(token, m.publicKey, &payload, nil)
	if err != nil {
		return nil, err
	}
	if time.Now().After(payload.ExpiresAt) {
		return nil, errors.New("token has expired")
	}
	return &payload, nil
}

func (m *PasetoMaker) PublicKey() ed25519.PublicKey {
	return m.publicKey
}
