package models

import "time"

// User 结构体表示用户数据
type User struct {
	UUID         string    `json:"uuid"`
	Username     string    `json:"username"`
	Password     string    `json:"password"`
	Email        string    `json:"email"`
	Bio          string    `json:"bio"`
	Avatar       string    `json:"avatar"`
	StorageLimit int64     `json:"storage_limit"` // 存储空间限制（字节）
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// LoginRequest 登录请求结构体
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// RegisterRequest 注册请求结构体
type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Email    string `json:"email"`
}

// LoginResponse 登录响应结构体
type LoginResponse struct {
	Success       bool           `json:"success"`
	Message       string         `json:"message"`
	User          UserResponse   `json:"user"`
	LastLoginTime time.Time      `json:"last_login_time,omitempty"`
	Tokens        TokenPair      `json:"tokens,omitempty"`
	AdminTokens   AdminTokenPair `json:"admin_tokens,omitempty"`
}

// UserResponse 用户响应结构体
type UserResponse struct {
	UUID         string    `json:"uuid"`
	Username     string    `json:"username"`
	Email        string    `json:"email"`
	Bio          string    `json:"bio"`
	AvatarUrl    string    `json:"avatarUrl"`
	StorageLimit int64     `json:"storage_limit"` // 存储空间限制（字节）
	UsedSpace    int64     `json:"used_space"`    // 已使用存储空间（字节）
	CreatedAt    time.Time `json:"created_at"`    // 创建时间
}

// RegisterResponse 注册响应结构体
type RegisterResponse struct {
	Success bool         `json:"success"`
	Message string       `json:"message"`
	User    UserResponse `json:"user,omitempty"`
}

// LogoutResponse 退出登录响应结构体
type LogoutResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

// UserListResponse 用户列表响应结构体
type UserListResponse struct {
	Success  bool           `json:"success"`
	Users    []UserResponse `json:"users"`
	Total    int            `json:"total,omitempty"`
	Page     int            `json:"page,omitempty"`
	PageSize int            `json:"page_size,omitempty"`
	HasMore  bool           `json:"has_more,omitempty"`
}

// UpdateUserStorageRequest 更新用户存储限制请求结构体
type UpdateUserStorageRequest struct {
	UUID         string `json:"uuid" binding:"required"`
	StorageLimit int64  `json:"storage_limit" binding:"required"`
}
