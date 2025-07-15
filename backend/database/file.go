package database

import (
	"database/sql"
	"time"

	"backend/models"
)

// FileRepository 文件数据访问层
type FileRepository struct {
	db *sql.DB
}

// NewFileRepository 创建文件仓库实例
func NewFileRepository(db *sql.DB) *FileRepository {
	return &FileRepository{db: db}
}

// GetFilesByUserID 获取用户的文件列表
func (r *FileRepository) GetFilesByUserID(userID string, folderID *int) ([]models.File, error) {
	var rows *sql.Rows
	var err error

	if folderID == nil {
		// 查询该用户在根目录的文件（folder_id为NULL）
		rows, err = r.db.Query(`
			SELECT id, name, size, type, path, user_id, folder_id, created_at, updated_at 
			FROM files WHERE user_id = ? AND folder_id IS NULL 
			ORDER BY created_at DESC`, userID)
	} else {
		// 查询指定文件夹的文件
		rows, err = r.db.Query(`
			SELECT id, name, size, type, path, user_id, folder_id, created_at, updated_at 
			FROM files WHERE user_id = ? AND folder_id = ? 
			ORDER BY created_at DESC`, userID, *folderID)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var files []models.File
	for rows.Next() {
		var file models.File
		err := rows.Scan(&file.ID, &file.Name, &file.Size, &file.Type, &file.Path,
			&file.UserID, &file.FolderID, &file.CreatedAt, &file.UpdatedAt)
		if err != nil {
			continue
		}
		files = append(files, file)
	}

	return files, nil
}

// GetFileByID 根据ID获取文件
func (r *FileRepository) GetFileByID(fileID int, userID string) (*models.File, error) {
	var file models.File
	query := `SELECT id, name, size, type, path, user_id, folder_id, created_at, updated_at 
			  FROM files WHERE id = ? AND user_id = ?`

	err := r.db.QueryRow(query, fileID, userID).Scan(
		&file.ID, &file.Name, &file.Size, &file.Type, &file.Path,
		&file.UserID, &file.FolderID, &file.CreatedAt, &file.UpdatedAt)

	if err != nil {
		return nil, err
	}

	return &file, nil
}

// CreateFile 创建文件记录
func (r *FileRepository) CreateFile(file *models.File) error {
	query := `INSERT INTO files (name, size, type, path, user_id, folder_id, created_at, updated_at) 
			  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`

	result, err := r.db.Exec(query, file.Name, file.Size, file.Type, file.Path,
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

// DeleteFile 删除文件记录
func (r *FileRepository) DeleteFile(fileID int, userID string) error {
	query := `DELETE FROM files WHERE id = ? AND user_id = ?`
	_, err := r.db.Exec(query, fileID, userID)
	return err
}

// MoveFile 移动文件到指定文件夹
func (r *FileRepository) MoveFile(fileID int, userID string, folderID *int) error {
	query := `UPDATE files SET folder_id = ?, updated_at = ? WHERE id = ? AND user_id = ?`
	_, err := r.db.Exec(query, folderID, time.Now(), fileID, userID)
	return err
}

// GetUserTotalStorage 获取用户总存储使用量
func (r *FileRepository) GetUserTotalStorage(userID string) (int64, error) {
	var totalSize int64
	query := `SELECT COALESCE(SUM(size), 0) FROM files WHERE user_id = ?`
	err := r.db.QueryRow(query, userID).Scan(&totalSize)
	return totalSize, err
}
