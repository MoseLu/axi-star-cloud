package models

import "time"

// UrlFile URL文件结构体
type UrlFile struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Title       string    `gorm:"type:varchar(255);not null" json:"title"`       // URL标题
	URL         string    `gorm:"type:text;not null" json:"url"`         // URL链接
	Description string    `gorm:"type:text" json:"description"` // URL描述
	UserID      string    `gorm:"type:varchar(50);not null;index" json:"user_id"`     // 用户ID
	FolderID    *uint     `gorm:"index" json:"folder_id"`   // 所属文件夹ID，null表示根目录
	CreatedAt   time.Time `gorm:"type:datetime;not null" json:"created_at"`
	UpdatedAt   time.Time `gorm:"type:datetime;not null" json:"updated_at"`
}

// TableName 指定表名
func (UrlFile) TableName() string {
	return "url_files"
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
