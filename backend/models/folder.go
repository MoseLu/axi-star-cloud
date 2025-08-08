package models

import "time"

// Folder 结构体表示文件夹数据
type Folder struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Name      string    `gorm:"type:varchar(255);not null" json:"name"`
	UserID    string    `gorm:"type:varchar(50);not null;index" json:"user_id"`
	Category  string    `gorm:"type:varchar(50);default:'all';index" json:"category"` // 分类字段
	ParentID  *uint     `gorm:"index" json:"parent_id"`                               // 父文件夹ID
	CreatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" json:"updated_at"`
}

// TableName 指定表名
func (Folder) TableName() string {
	return "folders"
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
