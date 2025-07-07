package memcacheclient

import (
	"log"
	"strconv"
	"time"

	"github.com/bradfitz/gomemcache/memcache"
)

type Client struct {
	mc *memcache.Client
}

func NewMemcacheClient(addr string) *Client {
	return &Client{mc: memcache.New(addr)}
}

// Set OTP with a 10-minute TTL
func (c *Client) SetOTP(email, code string) error {
	return c.mc.Set(&memcache.Item{
		Key:        "otp:" + email,
		Value:      []byte(code),
		Expiration: int32(600), // 10 minutes
	})
}

// Get OTP
func (c *Client) GetOTP(email string) (string, error) {
	item, err := c.mc.Get("otp:" + email)
	if err != nil {
		return "", err
	}
	return string(item.Value), nil
}

// Set resend rate limit (1 min)
func (c *Client) SetRateLimit(email string) error {
	return c.mc.Set(&memcache.Item{
		Key:        "rate:" + email,
		Value:      []byte("1"),
		Expiration: int32(60), // 60 seconds
	})
}

// Check if rate-limited
func (c *Client) IsRateLimited(email string) (bool, error) {
	_, err := c.mc.Get("rate:" + email)
	if err == memcache.ErrCacheMiss {
		return false, nil
	}
	return err == nil, err
}

// --- Refresh Token Methods with DEBUG LOGGING ---

// SetRefreshToken stores a refresh token with a 7-day expiration.
func (c *Client) SetRefreshToken(token string, userId uint64) error {
	key := "refresh:" + token
	expiration := int32((7 * 24 * time.Hour).Seconds())
	log.Printf("[DEBUG_MEMCACHE] SETTING refresh token with key: '%s' for userID: %d", key, userId)

	err := c.mc.Set(&memcache.Item{
		Key:        key,
		Value:      []byte(strconv.FormatUint(userId, 10)),
		Expiration: expiration,
	})

	if err != nil {
		log.Printf("[DEBUG_MEMCACHE] FAILED to set refresh token for key: '%s'. Error: %v", key, err)
	} else {
		log.Printf("[DEBUG_MEMCACHE] SUCCESSFULLY set refresh token for key: '%s'", key)
	}
	return err
}

// GetRefreshToken retrieves a user ID by the refresh token.
func (c *Client) GetRefreshToken(token string) (uint64, error) {
	key := "refresh:" + token
	log.Printf("[DEBUG_MEMCACHE] GETTING refresh token with key: '%s'", key)
	item, err := c.mc.Get(key)

	if err != nil {
		log.Printf("[DEBUG_MEMCACHE] FAILED to get refresh token for key: '%s'. Error: %v", key, err)
		return 0, err // Propagate the error (e.g., memcache.ErrCacheMiss)
	}

	log.Printf("[DEBUG_MEMCACHE] SUCCESSFULLY got refresh token for key: '%s'. Value: '%s'", key, string(item.Value))
	userId, convErr := strconv.ParseUint(string(item.Value), 10, 64)
	if convErr != nil {
		log.Printf("[DEBUG_MEMCACHE] FAILED to parse userID from value: '%s'. Error: %v", string(item.Value), convErr)
		return 0, convErr
	}

	return userId, nil
}

// DeleteRefreshToken removes a refresh token from the cache.
func (c *Client) DeleteRefreshToken(token string) error {
	key := "refresh:" + token
	log.Printf("[DEBUG_MEMCACHE] DELETING refresh token with key: '%s'", key)
	err := c.mc.Delete(key)

	if err != nil {
		log.Printf("[DEBUG_MEMCACHE] FAILED to delete refresh token for key: '%s'. Error: %v", key, err)
	} else {
		log.Printf("[DEBUG_MEMCACHE] SUCCESSFULLY deleted refresh token for key: '%s'", key)
	}
	return err
}