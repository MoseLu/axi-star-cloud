package models

import (
	"time"
)

// TokenPair 双token结构
type TokenPair struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	ExpiresAt    time.Time `json:"expires_at"`
}

// AdminTokenPair 管理员双token结构
type AdminTokenPair struct {
	AdminAccessToken  string    `json:"admin_access_token"`
	AdminRefreshToken string    `json:"admin_refresh_token"`
	AdminExpiresAt    time.Time `json:"admin_expires_at"`
}

// TokenRefreshRequest token刷新请求
type TokenRefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// AdminTokenRefreshRequest 管理员token刷新请求
type AdminTokenRefreshRequest struct {
	AdminRefreshToken string `json:"admin_refresh_token" binding:"required"`
}

// TokenRefreshResponse token刷新响应
type TokenRefreshResponse struct {
	Success bool      `json:"success"`
	Message string    `json:"message"`
	Tokens  TokenPair `json:"tokens"`
}

// AdminTokenRefreshResponse 管理员token刷新响应
type AdminTokenRefreshResponse struct {
	Success     bool           `json:"success"`
	Message     string         `json:"message"`
	AdminTokens AdminTokenPair `json:"admin_tokens"`
}

// TokenValidationRequest token验证请求
type TokenValidationRequest struct {
	AccessToken string `json:"access_token" binding:"required"`
}

// AdminTokenValidationRequest 管理员token验证请求
type AdminTokenValidationRequest struct {
	AdminAccessToken string `json:"admin_access_token" binding:"required"`
}

// TokenValidationResponse token验证响应
type TokenValidationResponse struct {
	Success bool         `json:"success"`
	Valid   bool         `json:"valid"`
	User    UserResponse `json:"user,omitempty"`
	Message string       `json:"message,omitempty"`
}

// AdminTokenValidationResponse 管理员token验证响应
type AdminTokenValidationResponse struct {
	Success bool         `json:"success"`
	Valid   bool         `json:"valid"`
	User    UserResponse `json:"user,omitempty"`
	Message string       `json:"message,omitempty"`
}
