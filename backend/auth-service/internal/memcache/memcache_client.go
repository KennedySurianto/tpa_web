package memcache

import (
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
