package middleware

import (
	"context"	
)

// GetUserID extracts the user ID from context
func GetUserID(ctx context.Context) (uint64, bool) {
	val, ok := ctx.Value(ContextUserID).(uint64)
	return val, ok
}

// GetEmail extracts the email from context
func GetEmail(ctx context.Context) (string, bool) {
	val, ok := ctx.Value(ContextEmail).(string)
	return val, ok
}

// GetUsername extracts the username from context
func GetUsername(ctx context.Context) (string, bool) {
	val, ok := ctx.Value(ContextUsername).(string)
	return val, ok
}
