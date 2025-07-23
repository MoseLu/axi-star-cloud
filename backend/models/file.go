package models

import "time"

// File 结构体表示文件数据
type File struct {
	ID            int       `json:"id"`
	Name          string    `json:"name"`
	Size          int64     `json:"size"`
	Type          string    `json:"type"`
	Path          string    `json:"path"`
	UserID        string    `json:"user_id"`
	FolderID      *int      `json:"folder_id"`                // 所属文件夹ID，null表示根目录
	ThumbnailData *string   `json:"thumbnail_data,omitempty"` // 缩略图数据，用于存储视频缩略图
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// FileListResponse 文件列表响应结构体
type FileListResponse struct {
	Success bool   `json:"success"`
	Files   []File `json:"files"`
}

// FileResponse 单个文件响应结构体
type FileResponse struct {
	Success bool `json:"success"`
	File    File `json:"file"`
}

// MoveFileRequest 移动文件请求结构体
type MoveFileRequest struct {
	FolderID int `json:"folder_id"`
}

// CreateUrlRequest URL创建请求结构体
type CreateUrlRequest struct {
	Title       string `json:"title"`
	URL         string `json:"url"`
	Description string `json:"description"`
	UserID      string `json:"user_id"`
}
