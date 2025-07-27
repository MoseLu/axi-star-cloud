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
		thumbnail_data TEXT,
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

	// 创建文档表
	createDocumentsTable := `
	CREATE TABLE IF NOT EXISTS documents (
		id INT AUTO_INCREMENT PRIMARY KEY,
		title VARCHAR(255) NOT NULL,
		category VARCHAR(100) NOT NULL,
		` + "`order`" + ` INT DEFAULT 0,
		filename VARCHAR(255) NOT NULL,
		path VARCHAR(500) NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		INDEX idx_category (category),
		INDEX idx_order (` + "`order`" + `)
	)`

	_, err = db.Exec(createDocumentsTable)
	if err != nil {
		return err
	}

	// 创建更新日志表
	createUpdateLogsTable := `
	CREATE TABLE IF NOT EXISTS update_logs (
		id INT AUTO_INCREMENT PRIMARY KEY,
		version VARCHAR(20) NOT NULL,
		title VARCHAR(255) NOT NULL,
		description TEXT,
		release_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		features JSON,
		known_issues JSON,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
		INDEX idx_version (version),
		INDEX idx_release_date (release_date)
	)`

	_, err = db.Exec(createUpdateLogsTable)
	if err != nil {
		return err
	}

	return nil
}

// InsertInitialData 插入初始数据
func InsertInitialData(db *sql.DB) error {
	// 插入Mose管理员用户数据
	insertUser := `
	INSERT IGNORE INTO user (uuid, username, password, email, bio, storage_limit, created_at, updated_at) VALUES 
	('550e8400-e29b-41d4-a716-446655440000', 'Mose', '123456', 'mose@example.com', '系统管理员', 5368709120, NOW(), NOW())`

	_, err := db.Exec(insertUser)
	if err != nil {
		return err
	}

	// 删除自动插入测试文件的逻辑

	// 插入初始更新日志数据
	insertUpdateLogs := `
	INSERT IGNORE INTO update_logs (version, title, description, release_date, features, known_issues) VALUES 
	('1.0.0', '星际云盘正式发布', '首个正式版本发布，提供完整的文件管理功能', '2024-01-01 00:00:00', 
	'["文件上传下载", "文件夹管理", "文件预览", "用户认证", "存储空间管理"]', '[]'),
	('1.1.0', '性能优化与界面改进', '优化应用性能，改进用户界面体验', '2024-01-15 00:00:00', 
	'["界面响应速度提升", "文件上传进度显示", "拖拽上传支持", "文件类型图标"]', '[]'),
	('1.2.0', '新增文档管理功能', '添加文档同步和管理功能', '2024-02-01 00:00:00', 
	'["文档同步", "文档预览", "文档搜索", "文档分类管理"]', '[]')`

	_, err = db.Exec(insertUpdateLogs)
	if err != nil {
		return err
	}

	return nil
}
