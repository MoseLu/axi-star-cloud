package database

import (
	"database/sql"
)

// CreateTables 创建数据库表
func CreateTables(db *sql.DB) error {
	// 创建用户表
	createUserTable := `
	CREATE TABLE IF NOT EXISTS user (
		uuid VARCHAR(50) PRIMARY KEY,
		username VARCHAR(50) UNIQUE NOT NULL,
		password VARCHAR(255) NOT NULL,
		email VARCHAR(100),
		bio TEXT,
		avatar VARCHAR(500),
		storage_limit BIGINT DEFAULT 5368709120,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
	)`

	_, err := db.Exec(createUserTable)
	if err != nil {
		return err
	}

	// 创建文件表
	createFilesTable := `
	CREATE TABLE IF NOT EXISTS files (
		id INT AUTO_INCREMENT PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		size BIGINT NOT NULL,
		type VARCHAR(50) NOT NULL,
		path VARCHAR(500) NOT NULL,
		user_id VARCHAR(50) NOT NULL,
		folder_id INT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		INDEX idx_user_id (user_id),
		INDEX idx_created_at (created_at)
	)`

	_, err = db.Exec(createFilesTable)
	if err != nil {
		return err
	}

	// 创建文件夹表
	createFoldersTable := `
	CREATE TABLE IF NOT EXISTS folders (
		id INT AUTO_INCREMENT PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		user_id VARCHAR(50) NOT NULL,
		category VARCHAR(50) DEFAULT 'all',
		parent_id INT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		INDEX idx_user_id (user_id),
		INDEX idx_parent_id (parent_id),
		INDEX idx_category (category)
	)`

	_, err = db.Exec(createFoldersTable)
	if err != nil {
		return err
	}

	return nil
}

// InsertInitialData 插入初始数据
func InsertInitialData(db *sql.DB) error {
	// 插入Mose管理员用户数据
	insertUser := `
	INSERT IGNORE INTO user (uuid, username, password, email, bio, is_admin) VALUES 
	('550e8400-e29b-41d4-a716-446655440000', 'Mose', '123456', 'mose@example.com', '系统管理员', TRUE)`

	_, err := db.Exec(insertUser)
	if err != nil {
		return err
	}

	// 删除自动插入测试文件的逻辑

	return nil
}
