package database

import (
	"database/sql"
	"time"

	"backend/models"
)

// UrlFileRepository URL文件数据访问层
type UrlFileRepository struct {
	db *sql.DB
}

// NewUrlFileRepository 创建URL文件仓库实例
func NewUrlFileRepository(db *sql.DB) *UrlFileRepository {
	return &UrlFileRepository{db: db}
}

// GetUrlFilesByUserID 获取用户的URL文件列表
func (r *UrlFileRepository) GetUrlFilesByUserID(userID string, folderID *int) ([]models.UrlFile, error) {
	var rows *sql.Rows
	var err error

	if folderID == nil {
		// 查询所有URL文件（不限制folder_id）
		rows, err = r.db.Query(`
			SELECT id, title, url, description, user_id, folder_id, created_at, updated_at
			FROM url_files WHERE user_id = ?
			ORDER BY created_at DESC`, userID)
	} else {
		// 查询指定文件夹的URL文件
		rows, err = r.db.Query(`
			SELECT id, title, url, description, user_id, folder_id, created_at, updated_at
			FROM url_files WHERE user_id = ? AND folder_id = ? 
			ORDER BY created_at DESC`, userID, *folderID)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var files []models.UrlFile
	for rows.Next() {
		var file models.UrlFile
		err := rows.Scan(&file.ID, &file.Title, &file.URL, &file.Description,
			&file.UserID, &file.FolderID, &file.CreatedAt, &file.UpdatedAt)
		if err != nil {
			continue
		}
		files = append(files, file)
	}

	return files, nil
}

// GetUrlFileByID 根据ID获取URL文件
func (r *UrlFileRepository) GetUrlFileByID(fileID int, userID string) (*models.UrlFile, error) {
	var file models.UrlFile
	query := `SELECT id, title, url, description, user_id, folder_id, created_at, updated_at
			  FROM url_files WHERE id = ? AND user_id = ?`

	err := r.db.QueryRow(query, fileID, userID).Scan(
		&file.ID, &file.Title, &file.URL, &file.Description,
		&file.UserID, &file.FolderID, &file.CreatedAt, &file.UpdatedAt)

	if err != nil {
		return nil, err
	}

	return &file, nil
}

// CreateUrlFile 创建URL文件记录
func (r *UrlFileRepository) CreateUrlFile(file *models.UrlFile) error {
	query := `INSERT INTO url_files (title, url, description, user_id, folder_id, created_at, updated_at) 
			  VALUES (?, ?, ?, ?, ?, ?, ?)`

	result, err := r.db.Exec(query, file.Title, file.URL, file.Description,
		file.UserID, file.FolderID, time.Now(), time.Now())
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	file.ID = int(id)
	return nil
}

// DeleteUrlFile 删除URL文件记录
func (r *UrlFileRepository) DeleteUrlFile(fileID int, userID string) error {
	query := `DELETE FROM url_files WHERE id = ? AND user_id = ?`
	_, err := r.db.Exec(query, fileID, userID)
	return err
}

// MoveUrlFile 移动URL文件到指定文件夹
func (r *UrlFileRepository) MoveUrlFile(fileID int, userID string, folderID *int) error {
	query := `UPDATE url_files SET folder_id = ?, updated_at = ? WHERE id = ? AND user_id = ?`
	_, err := r.db.Exec(query, folderID, time.Now(), fileID, userID)
	return err
}

// GetUserTotalUrlFileCount 获取用户所有URL文件总数
func (r *UrlFileRepository) GetUserTotalUrlFileCount(userID string) (int, error) {
	var totalCount int
	query := `SELECT COUNT(*) FROM url_files WHERE user_id = ?`
	err := r.db.QueryRow(query, userID).Scan(&totalCount)
	return totalCount, err
}

// GetFolderUrlFileCount 获取指定文件夹中的URL文件数量
func (r *UrlFileRepository) GetFolderUrlFileCount(folderID int, userID string) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM url_files WHERE folder_id = ? AND user_id = ?`
	err := r.db.QueryRow(query, folderID, userID).Scan(&count)
	return count, err
}
