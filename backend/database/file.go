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
func (r *FileRepository) GetFilesByUserID(userID string, folderID *uint) ([]models.File, error) {
	var rows *sql.Rows
	var err error

	if folderID == nil {
		// 查询所有文件（不限制folder_id）
		rows, err = r.db.Query(`
			SELECT id, name, size, type, path, user_id, created_at, updated_at, folder_id, thumbnail_data
			FROM files WHERE user_id = ?
			ORDER BY created_at DESC`, userID)
	} else {
		// 查询指定文件夹的文件
		rows, err = r.db.Query(`
			SELECT id, name, size, type, path, user_id, created_at, updated_at, folder_id, thumbnail_data
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
		var thumbnailData sql.NullString
		err := rows.Scan(&file.ID, &file.Name, &file.Size, &file.Type, &file.Path,
			&file.UserID, &file.CreatedAt, &file.UpdatedAt, &file.FolderID, &thumbnailData)
		if err != nil {
			continue
		}

		// 转换sql.NullString为string
		if thumbnailData.Valid {
			file.ThumbnailData = thumbnailData.String
		}

		files = append(files, file)
	}

	return files, nil
}

// GetFileByID 根据ID获取文件
func (r *FileRepository) GetFileByName(fileName, userID string) (*models.File, error) {
	var file models.File
	query := `SELECT id, name, size, type, path, user_id, folder_id, thumbnail_data, created_at, updated_at 
			  FROM files WHERE name = ? AND user_id = ?`
	err := r.db.QueryRow(query, fileName, userID).Scan(
		&file.ID, &file.Name, &file.Size, &file.Type, &file.Path, &file.UserID, &file.FolderID, &file.ThumbnailData, &file.CreatedAt, &file.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &file, nil
}

func (r *FileRepository) GetFileByID(fileID uint, userID string) (*models.File, error) {
	var file models.File
	var thumbnailData sql.NullString
	query := `SELECT id, name, size, type, path, user_id, folder_id, thumbnail_data, created_at, updated_at
			  FROM files WHERE id = ? AND user_id = ?`

	err := r.db.QueryRow(query, fileID, userID).Scan(
		&file.ID, &file.Name, &file.Size, &file.Type, &file.Path,
		&file.UserID, &file.FolderID, &thumbnailData, &file.CreatedAt, &file.UpdatedAt)

	if err != nil {
		return nil, err
	}

	// 转换sql.NullString为string
	if thumbnailData.Valid {
		file.ThumbnailData = thumbnailData.String
	}

	return &file, nil
}

// GetFileByNameAndUser 根据文件名和用户ID获取文件
func (r *FileRepository) GetFileByNameAndUser(fileName string, userID string) (*models.File, error) {
	var file models.File
	var thumbnailData sql.NullString
	query := `SELECT id, name, size, type, path, user_id, folder_id, thumbnail_data, created_at, updated_at
			  FROM files WHERE name = ? AND user_id = ?`

	err := r.db.QueryRow(query, fileName, userID).Scan(
		&file.ID, &file.Name, &file.Size, &file.Type, &file.Path,
		&file.UserID, &file.FolderID, &thumbnailData, &file.CreatedAt, &file.UpdatedAt)

	if err != nil {
		return nil, err
	}

	// 转换sql.NullString为string
	if thumbnailData.Valid {
		file.ThumbnailData = thumbnailData.String
	}

	return &file, nil
}

// CreateFile 创建文件记录
func (r *FileRepository) CreateFile(file *models.File) error {
	query := `INSERT INTO files (name, size, type, path, user_id, folder_id, thumbnail_data, created_at, updated_at) 
			  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`

	var thumbnailData sql.NullString
	if file.ThumbnailData != "" {
		thumbnailData.String = file.ThumbnailData
		thumbnailData.Valid = true
	}

	result, err := r.db.Exec(query, file.Name, file.Size, file.Type, file.Path,
		file.UserID, file.FolderID, thumbnailData, time.Now(), time.Now())
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	file.ID = uint(id)
	return nil
}

// DeleteFile 删除文件记录
func (r *FileRepository) DeleteFile(fileID uint, userID string) error {
	query := `DELETE FROM files WHERE id = ? AND user_id = ?`
	_, err := r.db.Exec(query, fileID, userID)
	return err
}

// MoveFile 移动文件到指定文件夹
func (r *FileRepository) MoveFile(fileID uint, userID string, folderID *uint) error {
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

func (r *FileRepository) GetUserFileCount(userID string) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM files WHERE user_id = ?`
	err := r.db.QueryRow(query, userID).Scan(&count)
	return count, err
}

// GetUserTotalFileCount 获取用户文件总数
func (r *FileRepository) GetUserTotalFileCount(userID string) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM files WHERE user_id = ?`
	err := r.db.QueryRow(query, userID).Scan(&count)
	return count, err
}

func (r *FileRepository) GetTotalFileCount() (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM files`
	err := r.db.QueryRow(query).Scan(&count)
	return count, err
}

// TestDatabaseConnection 测试数据库连接
func (r *FileRepository) TestDatabaseConnection() (int, error) {
	var count int
	err := r.db.QueryRow("SELECT COUNT(*) FROM files").Scan(&count)
	return count, err
}

// SearchFilesByUserID 根据关键词搜索用户的文件
func (r *FileRepository) SearchFilesByUserID(userID string, query string, folderID *uint) ([]models.File, error) {
	var rows *sql.Rows
	var err error

	searchQuery := "%" + query + "%"

	if folderID == nil {
		// 搜索该用户的所有文件
		rows, err = r.db.Query(`
			SELECT id, name, size, type, path, user_id, folder_id, thumbnail_data, created_at, updated_at
			FROM files WHERE user_id = ? AND (name LIKE ? OR type LIKE ?)
			ORDER BY created_at DESC`, userID, searchQuery, searchQuery)
	} else {
		// 搜索指定文件夹的文件
		rows, err = r.db.Query(`
			SELECT id, name, size, type, path, user_id, folder_id, thumbnail_data, created_at, updated_at
			FROM files WHERE user_id = ? AND folder_id = ? AND (name LIKE ? OR type LIKE ?)
			ORDER BY created_at DESC`, userID, *folderID, searchQuery, searchQuery)
	}

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var files []models.File
	for rows.Next() {
		var file models.File
		var thumbnailData sql.NullString
		err := rows.Scan(&file.ID, &file.Name, &file.Size, &file.Type, &file.Path,
			&file.UserID, &file.FolderID, &thumbnailData, &file.CreatedAt, &file.UpdatedAt)
		if err != nil {
			continue
		}

		// 转换sql.NullString为string
		if thumbnailData.Valid {
			file.ThumbnailData = thumbnailData.String
		}

		files = append(files, file)
	}

	return files, nil
}
