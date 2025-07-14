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

// LoginResponse 登录响应结构体
type LoginResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	User    struct {
		UUID     string `json:"uuid"`
		Username string `json:"username"`
	} `json:"user"`
}
