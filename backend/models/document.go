package models

import "time"

// Document 文档结构体
type Document struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Title     string    `gorm:"type:varchar(255);not null" json:"title"`
	Category  string    `gorm:"type:varchar(100);not null;index" json:"category"`
	Order     int       `gorm:"type:int;default:0;index" json:"order"`
	Filename  string    `gorm:"type:varchar(255);not null" json:"filename"`
	Path      string    `gorm:"type:varchar(500);not null" json:"path"`
	CreatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP" json:"updated_at"`
}

// TableName 指定表名
func (Document) TableName() string {
	return "documents"
}

// DocumentListResponse 文档列表响应结构体
type DocumentListResponse struct {
	Success   bool       `json:"success"`
	Documents []Document `json:"documents"`
}

// DocumentResponse 单个文档响应结构体
type DocumentResponse struct {
	Success  bool     `json:"success"`
	Document Document `json:"document"`
}

// CreateDocumentRequest 创建文档请求结构体
type CreateDocumentRequest struct {
	Title    string `json:"title" binding:"required"`
	Category string `json:"category" binding:"required"`
	Order    int    `json:"order"`
} 