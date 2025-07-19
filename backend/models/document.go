package models

import "time"

// Document 文档结构体
type Document struct {
	ID        int       `json:"id"`
	Title     string    `json:"title"`
	Category  string    `json:"category"`
	Order     int       `json:"order"`
	Filename  string    `json:"filename"`
	Path      string    `json:"path"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
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