package database

import (
	"database/sql"
	"time"

	"backend/models"
)

// FolderRepository 文件夹数据访问层
type FolderRepository struct {
	db *sql.DB
}

// NewFolderRepository 创建文件夹仓库实例
func NewFolderRepository(db *sql.DB) *FolderRepository {
	return &FolderRepository{db: db}
}

// GetFoldersByUserID 获取用户的文件夹列表
func (r *FolderRepository) GetFoldersByUserID(userID string) ([]models.Folder, error) {
	query := `SELECT id, name, user_id, category, parent_id, created_at, updated_at 
			  FROM folders WHERE user_id = ? ORDER BY created_at DESC`

	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var folders []models.Folder
	for rows.Next() {
		var folder models.Folder
		err := rows.Scan(&folder.ID, &folder.Name, &folder.UserID, &folder.Category,
			&folder.ParentID, &folder.CreatedAt, &folder.UpdatedAt)
		if err != nil {
			continue
		}
		folders = append(folders, folder)
	}

	return folders, nil
}

// GetFolderByID 根据ID获取文件夹
func (r *FolderRepository) GetFolderByID(folderID int, userID string) (*models.Folder, error) {
	var folder models.Folder
	query := `SELECT id, name, user_id, category, parent_id, created_at, updated_at 
			  FROM folders WHERE id = ? AND user_id = ?`

	err := r.db.QueryRow(query, folderID, userID).Scan(
		&folder.ID, &folder.Name, &folder.UserID, &folder.Category,
		&folder.ParentID, &folder.CreatedAt, &folder.UpdatedAt)

	if err != nil {
		return nil, err
	}

	return &folder, nil
}

// CreateFolder 创建文件夹
func (r *FolderRepository) CreateFolder(folder *models.Folder) error {
	query := `INSERT INTO folders (name, user_id, category, parent_id, created_at, updated_at) 
			  VALUES (?, ?, ?, ?, ?, ?)`

	result, err := r.db.Exec(query, folder.Name, folder.UserID, folder.Category,
		folder.ParentID, time.Now(), time.Now())
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	folder.ID = int(id)
	return nil
}

// UpdateFolder 更新文件夹
func (r *FolderRepository) UpdateFolder(folderID int, userID string, name, category string) error {
	query := `UPDATE folders SET name = ?, category = ?, updated_at = ? WHERE id = ? AND user_id = ?`
	_, err := r.db.Exec(query, name, category, time.Now(), folderID, userID)
	return err
}

// DeleteFolder 删除文件夹
func (r *FolderRepository) DeleteFolder(folderID int, userID string) error {
	// 首先删除文件夹中的所有普通文件
	_, err := r.db.Exec("DELETE FROM files WHERE folder_id = ? AND user_id = ?", folderID, userID)
	if err != nil {
		return err
	}

	// 删除文件夹中的所有URL文件
	_, err = r.db.Exec("DELETE FROM url_files WHERE folder_id = ? AND user_id = ?", folderID, userID)
	if err != nil {
		return err
	}

	// 然后删除文件夹
	query := `DELETE FROM folders WHERE id = ? AND user_id = ?`
	_, err = r.db.Exec(query, folderID, userID)
	return err
}

// CheckFolderExists 检查文件夹是否存在
func (r *FolderRepository) CheckFolderExists(folderID int, userID string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM folders WHERE id = ? AND user_id = ?)`
	err := r.db.QueryRow(query, folderID, userID).Scan(&exists)
	return exists, err
}

// CheckFolderNameExists 检查同一用户同一分类下是否存在同名文件夹
func (r *FolderRepository) CheckFolderNameExists(userID, name, category string, excludeID ...int) (bool, error) {
	var query string
	var args []interface{}

	if len(excludeID) > 0 && excludeID[0] > 0 {
		// 排除指定ID的文件夹（用于更新时检查）
		query = `SELECT EXISTS(SELECT 1 FROM folders WHERE user_id = ? AND name = ? AND category = ? AND id != ?)`
		args = []interface{}{userID, name, category, excludeID[0]}
	} else {
		// 创建时检查
		query = `SELECT EXISTS(SELECT 1 FROM folders WHERE user_id = ? AND name = ? AND category = ?)`
		args = []interface{}{userID, name, category}
	}

	var exists bool
	err := r.db.QueryRow(query, args...).Scan(&exists)
	return exists, err
}

// GetFolderFileCount 获取文件夹中的文件数量（包括普通文件和URL文件）
func (r *FolderRepository) GetFolderFileCount(folderID int, userID string) (int, error) {
	var filesCount, urlFilesCount int

	// 统计普通文件数量
	filesQuery := `SELECT COUNT(*) FROM files WHERE folder_id = ? AND user_id = ?`
	err := r.db.QueryRow(filesQuery, folderID, userID).Scan(&filesCount)
	if err != nil {
		return 0, err
	}

	// 统计URL文件数量
	urlFilesQuery := `SELECT COUNT(*) FROM url_files WHERE folder_id = ? AND user_id = ?`
	err = r.db.QueryRow(urlFilesQuery, folderID, userID).Scan(&urlFilesCount)
	if err != nil {
		return filesCount, nil // 如果URL文件统计失败，至少返回普通文件数量
	}

	return filesCount + urlFilesCount, nil
}
