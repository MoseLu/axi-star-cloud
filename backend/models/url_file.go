package models

import "time"

// UrlFile URL文件结构体
type UrlFile struct {
	ID          int       `json:"id"`
	Title       string    `json:"title"`       // URL标题
	URL         string    `json:"url"`         // URL链接
	Description string    `json:"description"` // URL描述
	UserID      string    `json:"user_id"`     // 用户ID
	FolderID    *int      `json:"folder_id"`   // 所属文件夹ID，null表示根目录
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// UrlFileListResponse URL文件列表响应结构体
type UrlFileListResponse struct {
	Success bool      `json:"success"`
	Files   []UrlFile `json:"files"`
}

// UrlFileResponse 单个URL文件响应结构体
type UrlFileResponse struct {
	Success bool    `json:"success"`
	File    UrlFile `json:"file"`
}
