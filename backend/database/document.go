package database

import (
	"database/sql"
	"fmt"
	"time"

	"backend/models"
)

// DocumentRepository 文档数据访问层
type DocumentRepository struct {
	db *sql.DB
}

// NewDocumentRepository 创建文档仓库实例
func NewDocumentRepository(db *sql.DB) *DocumentRepository {
	return &DocumentRepository{db: db}
}

// CreateDocument 创建文档记录
func (r *DocumentRepository) CreateDocument(doc *models.Document) error {
	// 检查是否已存在相同标题和分类的文档
	checkQuery := `SELECT id FROM documents WHERE title = ? AND category = ?`
	var existingID int
	err := r.db.QueryRow(checkQuery, doc.Title, doc.Category).Scan(&existingID)
	if err == nil {
		// 文档已存在
		return fmt.Errorf("文档已存在")
	} else if err != sql.ErrNoRows {
		// 其他数据库错误
		return err
	}

	// 创建新文档记录
	query := `INSERT INTO documents (title, category, ` + "`order`" + `, filename, path, created_at, updated_at) 
			  VALUES (?, ?, ?, ?, ?, ?, ?)`

	result, err := r.db.Exec(query, doc.Title, doc.Category, doc.Order, doc.Filename, doc.Path, time.Now(), time.Now())
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	doc.ID = int(id)
	return nil
}

// GetDocuments 获取所有文档
func (r *DocumentRepository) GetDocuments() ([]models.Document, error) {
	query := `SELECT id, title, category, ` + "`order`" + `, filename, path, created_at, updated_at 
			  FROM documents ORDER BY ` + "`order`" + ` ASC, created_at DESC`

	rows, err := r.db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var documents []models.Document
	for rows.Next() {
		var doc models.Document
		err := rows.Scan(&doc.ID, &doc.Title, &doc.Category, &doc.Order, &doc.Filename, &doc.Path, &doc.CreatedAt, &doc.UpdatedAt)
		if err != nil {
			continue
		}
		documents = append(documents, doc)
	}

	return documents, nil
}

// GetDocumentByID 根据ID获取文档
func (r *DocumentRepository) GetDocumentByID(id int) (*models.Document, error) {
	var doc models.Document
	query := `SELECT id, title, category, ` + "`order`" + `, filename, path, created_at, updated_at 
			  FROM documents WHERE id = ?`

	err := r.db.QueryRow(query, id).Scan(&doc.ID, &doc.Title, &doc.Category, &doc.Order, &doc.Filename, &doc.Path, &doc.CreatedAt, &doc.UpdatedAt)
	if err != nil {
		return nil, err
	}

	return &doc, nil
}

// DeleteDocument 删除文档
func (r *DocumentRepository) DeleteDocument(id int) error {
	query := `DELETE FROM documents WHERE id = ?`
	_, err := r.db.Exec(query, id)
	return err
}
