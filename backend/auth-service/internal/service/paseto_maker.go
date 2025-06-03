package service

import (
	"crypto/ed25519"
	"crypto/rand"
	"errors"
	"time"

	"github.com/o1egl/paseto"
)

type PasetoMaker struct {
	paseto     *paseto.V2
	privateKey ed25519.PrivateKey
	publicKey  ed25519.PublicKey
}

type PasetoPayload struct {
	UserID    uint64    `json:"user_id"`
	Email     string    `json:"email"`
	IssuedAt  time.Time `json:"issued_at"`
	ExpiresAt time.Time `json:"expires_at"`
}

func NewPasetoMaker() *PasetoMaker {
	publicKey, privateKey, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		return nil
	}

	return &PasetoMaker{
		paseto:     paseto.NewV2(),
		privateKey: privateKey,
		publicKey:  publicKey,
	}
}

func (m *PasetoMaker) CreateToken(userID uint64, email string, duration time.Duration) (string, *PasetoPayload, error) {
	payload := &PasetoPayload{
		UserID:    userID,
		Email:     email,
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
