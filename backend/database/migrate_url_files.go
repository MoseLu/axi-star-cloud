package database

import (
	"database/sql"
)

// MigrateUrlFiles 创建URL文件表
func MigrateUrlFiles(db *sql.DB) error {
	// 创建表
	createTableQuery := `
	CREATE TABLE IF NOT EXISTS url_files (
		id INTEGER AUTO_INCREMENT PRIMARY KEY,
		title VARCHAR(255) NOT NULL,
		url TEXT NOT NULL,
		description TEXT,
		user_id VARCHAR(50) NOT NULL,
		folder_id INTEGER,
		created_at DATETIME NOT NULL,
		updated_at DATETIME NOT NULL,
		FOREIGN KEY (user_id) REFERENCES user(uuid) ON DELETE CASCADE,
		FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
	)`

	_, err := db.Exec(createTableQuery)
	if err != nil {
		return err
	}

	// 创建索引（MySQL不支持IF NOT EXISTS，使用错误处理）
	indexQueries := []string{
		"CREATE INDEX idx_url_files_user_id ON url_files(user_id)",
		"CREATE INDEX idx_url_files_folder_id ON url_files(folder_id)",
		"CREATE INDEX idx_url_files_created_at ON url_files(created_at)",
	}

	for _, indexQuery := range indexQueries {
		_, err := db.Exec(indexQuery)
		if err != nil {
			// 如果索引已存在，会报错，这是正常的
		}
	}

	return nil
}
