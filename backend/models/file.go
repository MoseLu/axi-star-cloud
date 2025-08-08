package models

import "time"

// File 结构体表示文件数据
type File struct {
	ID            uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Name          string    `gorm:"type:varchar(255);not null" json:"name"`
	Size          int64     `gorm:"type:bigint;not null" json:"size"`
	Type          string    `gorm:"type:varchar(50);not null" json:"type"`
	Path          string    `gorm:"type:varchar(500);not null" json:"path"`
	UserID        string    `gorm:"type:varchar(50);not null;index" json:"user_id"`
	FolderID      *uint     `gorm:"index" json:"folder_id"`                // 所属文件夹ID，null表示根目录
	ThumbnailData string    `gorm:"type:longtext" json:"thumbnail_data,omitempty"` // 缩略图数据，用于存储视频缩略图
	CreatedAt     time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt     time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" json:"updated_at"`
}

// TableName 指定表名
func (File) TableName() string {
	return "files"
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
