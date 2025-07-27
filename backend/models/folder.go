package models

import "time"

// Folder 结构体表示文件夹数据
type Folder struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	UserID    string    `json:"user_id"`
	Category  string    `json:"category"`  // 分类字段
	ParentID  *int      `json:"parent_id"` // 父文件夹ID
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// FolderListResponse 文件夹列表响应结构体
type FolderListResponse struct {
	Success bool     `json:"success"`
	Folders []Folder `json:"folders"`
}

// FolderResponse 单个文件夹响应结构体
type FolderResponse struct {
	Success bool   `json:"success"`
	Folder  Folder `json:"folder"`
}

// CreateFolderRequest 创建文件夹请求结构体
type CreateFolderRequest struct {
	Name     string `json:"name" binding:"required"`
	Category string `json:"category"`
	ParentID *int   `json:"parent_id"`
}

// UpdateFolderRequest 更新文件夹请求结构体
type UpdateFolderRequest struct {
	Name     string `json:"name"`
	Category string `json:"category"`
}
